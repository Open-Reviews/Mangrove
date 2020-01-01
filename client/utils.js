export { imageUrl, downloadLink }

function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}

function downloadLink(data) {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(this.reviews)
  )}`
}
