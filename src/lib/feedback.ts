const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdPcLVP2DtD4wFdYzI_0VVXzfe96EJG9iEV1CI4RBWSUplicg/viewform'

const POI_ENTRY = 'entry.1086728398'

export function feedbackFormUrl(poiName?: string): string {
  const url = new URL(FEEDBACK_FORM_URL)
  url.searchParams.set('usp', 'pp_url')
  if (poiName) url.searchParams.set(POI_ENTRY, poiName)
  return url.toString()
}
