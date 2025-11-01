document.addEventListener("DOMContentLoaded", async () => {
    const contenedor = document.getElementById("productos-container");

    try {
        const response = await fetch("http://34.44.224.107/productos");

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const productos = await response.json();
        console.log("Productos cargados:", productos);

        contenedor.innerHTML = "";

        productos.forEach(prod => {
            const card = document.createElement("div");
            card.classList.add("producto-card");

            card.innerHTML = `
                <div class="producto-imagen">
                    <img src="${prod.imagen || 'https://via.placeholder.com/200x200?text=Sin+Imagen'}" alt="${prod.nombre}">
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${prod.nombre}</h3>
                    <p class="producto-marca">${prod.marca}</p>
                    <p class="producto-sku">SKU: ${prod.sku}</p>
                    <p class="producto-precio">$${prod.precio_venta.toFixed(2)}</p>
                    <p class="producto-stock">Stock: ${prod.stock}</p>
                    <button class="add-to-cart"
                        data-id="${prod.id}"
                        data-product="${prod.nombre}"
                        data-price="${prod.precio_venta}"
                        data-image="${prod.imagen || 'https://via.placeholder.com/250x200?text=Sin+Imagen'}">
                        Añadir al Carrito
                    </button>
                </div>
            `;
            contenedor.appendChild(card);
        });

    } catch (error) {
        console.error("Error al cargar los productos:", error);
        contenedor.innerHTML = "<p style='color:red;'>No se pudieron cargar los productos.</p>";
    }
});
