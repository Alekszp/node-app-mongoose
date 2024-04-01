exports.get404 = (req, res, next) => {
  res.status(404).render('404', {
    docTitle: '404 Page not found',
    path: '/404',
    isAuthenticated: req.session.isLoggedIn
  })
}

exports.get500 = (req, res, next) => {
  res.status(500).render('500', {
    docTitle: '500 Error!',
    path: '/500',
    errorMessage: 'Some technical issues occured! Please try later',
    isAuthenticated: req.session.isLoggedIn
  })
}