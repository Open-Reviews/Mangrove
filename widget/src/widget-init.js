(function () {
  function docReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 1)
    } else {
      document.addEventListener('DOMContentLoaded', fn)
    }
  }
  function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false
    }
    return typeof obj[Symbol.iterator] === 'function'
  }

  docReady(function () {
    const orReview = document.querySelectorAll('.or-review')
    if (!isIterable(orReview)) return
    orReview.forEach((el) => {
      const { _, dataset: {
        sub,
        title = '',
        language = null,
        blacklist = null,
        hidePhotos = false,
        filterOpinion = false,
        filterAnonymous = false
      } = {} } = el
      if (el && sub) {
        OpenReviewsWidget.init({
          selector: el,
          sub,
          title,
          language,
          blacklist,
          hidePhotos,
          filterOpinion,
          filterAnonymous
        })
      }
    })
  })
})()
