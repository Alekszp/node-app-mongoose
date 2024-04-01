const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name="productId"]').value
  const csrfToken = btn.parentNode.querySelector('[name="_csrf"]').value
  const prodElement = btn.closest('article')

  fetch(`/admin/product/${productId}`, {
    method: 'DELETE',
    headers: {
      'csrf-token': csrfToken
    }
  }).then((res) => {
    return res.json()
  })
  .then((data) => {
    console.log(data)
    prodElement.parentNode.removeChild(prodElement)
  })
  .catch((e) => {
    console.log(e)
  })
}