# Android-Releasecheck Geolocation

Diese Prüfung muss auf einem echten Android-Gerät jeweils in Chrome und Firefox durchgeführt werden. Browser-Simulationen liefern keinen belastbaren GPS-Kaltstart.

1. Website-Daten und Standortberechtigung für die App löschen.
2. App per HTTPS öffnen, Ortungsbutton antippen und Berechtigung erlauben.
3. Prüfen, dass spätestens nach einem GPS-Fix Positionspunkt und Genauigkeitskreis erscheinen.
4. Einige Meter gehen und prüfen, dass die Position aktualisiert wird, ohne die Karte bei jedem Fix zurückzuzwingen.
5. Berechtigung zurücksetzen, beim nächsten Versuch ablehnen und die sichtbare Fehlermeldung prüfen.
6. Flugmodus aktivieren und einen Kaltstart der Ortung abwarten; nach spätestens 30 Sekunden muss eine Fehlermeldung erscheinen.
7. Flugmodus deaktivieren und erneut orten; ein späterer Erfolg muss die alte Fehlermeldung entfernen.
