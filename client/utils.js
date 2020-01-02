export { imageUrl, downloadLink, displayName }

function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}

function downloadLink(data) {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data)
  )}`
}

function displayName(meta) {
  if (!meta) {
    return 'Anonymous'
  }
  if (meta.given_name || meta.family_name) {
    const realName = [meta.given_name, meta.family_name]
      .filter((n) => n)
      .join(' ')
    if (meta.display_name) {
      return `${meta.display_name} (${realName})`
    } else {
      return realName
    }
  } else if (meta.display_name) {
    return meta.display_name
  } else {
    return 'Anonymous'
  }
}
