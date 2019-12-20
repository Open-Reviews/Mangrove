export { imageUrl }

function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}
