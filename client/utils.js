export { toHexString, imageUrl }

function toHexString(byteArray) {
  return byteArray.reduce(
    (output, elem) => output + ('0' + elem.toString(16)).slice(-2),
    ''
  )
}

function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}
