import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = path.resolve('scripts/build-image-import-manifest.mjs');
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

describe('build-image-import-manifest', () => {
  it('builds a manifest from a configurable image directory', async () => {
    const workdir = await mkdtemp(path.join(os.tmpdir(), 'stahnsdorf-image-manifest-'));
    temporaryDirectories.push(workdir);

    const inputDirectory = path.join(workdir, 'new-images');
    await mkdir(inputDirectory);
    await writeFile(path.join(inputDirectory, '57 Neuer POI.jpg'), 'not-a-real-jpeg');
    await writeFile(path.join(workdir, 'old-manifest.json'), JSON.stringify({
      source_directory: 'old-images',
      image_count: 0,
      pois: [],
    }));
    await writeFile(path.join(workdir, 'backup.json'), JSON.stringify({
      pois: [{ id: 'poi_sws_neuer-poi', name: { de: 'Neuer POI' } }],
    }));

    execFileSync(process.execPath, [
      SCRIPT,
      '--old-manifest', 'old-manifest.json',
      '--input', 'new-images',
      '--backup', 'backup.json',
      '--output', 'result.json',
    ], { cwd: workdir });

    const result = JSON.parse(await readFile(path.join(workdir, 'result.json'), 'utf8'));
    expect(result.source_directories).toEqual(['old-images', 'new-images']);
    expect(result.pois).toHaveLength(1);
    expect(result.pois[0]).toMatchObject({
      plan_nummer: '57',
      vorhandener_poi_id: 'poi_sws_neuer-poi',
      bilder_gesamt: 1,
    });
    expect(result.pois[0].bilder[0].datei).toBe('new-images/57 Neuer POI.jpg');
  });

  it('allows plan numbers that were used in a different image directory', async () => {
    const workdir = await createFixture({
      sourceDirectories: ['old-images'],
      existingPois: [{ plan_nummer: '57', bilder: [] }],
    });

    execFileSync(process.execPath, buildArguments(), { cwd: workdir });

    const result = JSON.parse(await readFile(path.join(workdir, 'result.json'), 'utf8'));
    expect(result.pois.map((poi) => poi.plan_nummer)).toEqual(['57', '57']);
  });

  it('rejects importing the same image directory twice', async () => {
    const workdir = await createFixture({ sourceDirectories: ['new-images'] });

    expect(() => execFileSync(process.execPath, buildArguments(), {
      cwd: workdir,
      stdio: 'pipe',
    })).toThrow(/bereits importiert/);
  });

  it.each([
    ['Eingang', 'poi_sws_friedhofseingang', 'Haupteingang'],
    ['Garnisonsgrab', 'poi_sws_garnisongrab', 'Garnisongrab'],
  ])('maps camera-file alias %s to the canonical POI', async (alias, poiId, canonicalName) => {
    const workdir = await createFixture({
      inputFileName: `57 ${alias}.jpg`,
      backupPois: [{ id: poiId, name: { de: canonicalName } }],
    });

    execFileSync(process.execPath, buildArguments(), { cwd: workdir });

    const result = JSON.parse(await readFile(path.join(workdir, 'result.json'), 'utf8'));
    expect(result.pois[0].vorhandener_poi_id).toBe(poiId);
  });

  it('records confirmed credit overrides for camera files without creator metadata', async () => {
    const workdir = await createFixture({
      inputFileName: '66 Alte Umbettung.JPG',
      backupPois: [{ id: 'poi_sws_alte-umbettung', name: { de: 'Alte Umbettung' } }],
    });

    execFileSync(process.execPath, buildArguments(), { cwd: workdir });

    const result = JSON.parse(await readFile(path.join(workdir, 'result.json'), 'utf8'));
    expect(result.pois[0].bilder[0].nachweis).toBe('Lars Uhlemann');
  });
});

async function createFixture({
  sourceDirectories = [],
  existingPois = [],
  inputFileName = '57 Neuer POI.jpg',
  backupPois = [{ id: 'poi_sws_neuer-poi', name: { de: 'Neuer POI' } }],
} = {}) {
  const workdir = await mkdtemp(path.join(os.tmpdir(), 'stahnsdorf-image-manifest-'));
  temporaryDirectories.push(workdir);
  await mkdir(path.join(workdir, 'new-images'));
  await writeFile(path.join(workdir, 'new-images', inputFileName), 'not-a-real-jpeg');
  await writeFile(path.join(workdir, 'old-manifest.json'), JSON.stringify({
    source_directory: 'old-images',
    source_directories: sourceDirectories,
    image_count: 0,
    pois: existingPois,
  }));
  await writeFile(path.join(workdir, 'backup.json'), JSON.stringify({
    pois: backupPois,
  }));
  return workdir;
}

function buildArguments() {
  return [
    SCRIPT,
    '--old-manifest', 'old-manifest.json',
    '--input', 'new-images',
    '--backup', 'backup.json',
    '--output', 'result.json',
  ];
}
