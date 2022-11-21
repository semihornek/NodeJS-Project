const deleteProduct = async (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");

  try {
    const data = await (
      await fetch(`/admin/product/${prodId}`, {
        method: "DELETE",
        headers: {
          "csrf-token": csrf,
        },
      })
    ).json();

    productElement.parentNode.removeChild(productElement);
    console.log(data);
  } catch (error) {
    console.log(error);
  }
};
