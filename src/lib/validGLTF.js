import { validateBytes } from 'gltf-validator';

/**
 * @param {string} url 
 * @param {Record<string, Blob>} blobs 
 */
export async function validGLTF(url, blobs) {
  const report = validateBytes(await getUint8Array(url, blobs), {
    externalResourceFunction: (url) => getUint8Array(url, blobs)
  })
  return report;
}

/**
 * @param {string} url 
 * @param {Record<string, Blob>} blobs 
 */
async function getUint8Array(url, blobs) {
  const { url: realUrl, cleanup } = transferUrl(url, blobs)
  const response = await fetch(realUrl)
  cleanup()
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

/**
 * @param {string} url 
 * @param {Record<string, Blob>} blobs 
 */
function transferUrl(url, blobs) {
  const blob = blobs?.[url]
  if (blob) {
    url = URL.createObjectURL(blob)
  }
  const cleanup = () => URL.revokeObjectURL(url)
  return { url, cleanup }
}
