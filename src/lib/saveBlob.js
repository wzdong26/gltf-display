export const saveBlob = (() => {
  const a = document.createElement('a')
  document.body.appendChild(a)
  a.style.display = 'none'
  return (blob, fileName) => {
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }
})();
