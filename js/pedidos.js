document.addEventListener("DOMContentLoaded", async () => {
    const contenedor = document.getElementById("contenedor-pedidos");
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (!usuario) {
        contenedor.innerHTML = "<p>Debes iniciar sesión para ver tus pedidos.</p>";
        return;
    }

    // 🧾 Mostrar pedido pendiente (guardado desde el carrito)
    const pedidoTemporal = JSON.parse(localStorage.getItem("pedidoTemporal")) || [];

    if (pedidoTemporal.length > 0) {
        const pedidoTempContainer = document.createElement("div");
        pedidoTempContainer.classList.add("pedido-temp");

        const total = pedidoTemporal.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        const detallesHTML = pedidoTemporal.map(item => `
            <li>
                ${item.producto} (x${item.cantidad}) - $${item.precio} c/u 
                <strong>Subtotal:</strong> $${(item.precio * item.cantidad).toFixed(2)}
            </li>
        `).join("");

        pedidoTempContainer.innerHTML = `
            <h3>Pedido por confirmar</h3>
            <ul>${detallesHTML}</ul>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <button id="confirmarPedidoBtn">Confirmar pedido</button>
            <button id="cancelarPedidoBtn">Cancelar</button>
        `;

        contenedor.prepend(pedidoTempContainer);

        // ✅ Confirmar pedido (envía el POST)
        document.getElementById("confirmarPedidoBtn").addEventListener("click", async () => {
            if (!usuario || !usuario.id) {
                alert("Error: No se encontró el usuario logeado.");
                return;
            }

            const pedido = {
                cliente_id: null,
                usuario_id: usuario.id, // 🔥 se registra el usuario actual
                estado: "pendiente",
                total: total,
                detalles: pedidoTemporal.map(item => ({
                    autoparte_id: item.id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.precio * item.cantidad
                }))
            };

            try {
                const respuesta = await fetch("http://34.135.37.57/api/ventas", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(pedido)
                });

                if (!respuesta.ok) {
                    throw new Error(`Error al registrar el pedido: ${respuesta.status}`);
                }

                const data = await respuesta.json();
                console.log("✅ Pedido registrado:", data);

                localStorage.removeItem("pedidoTemporal");

                alert("Pedido registrado exitosamente ✅");
                contenedor.innerHTML = "<p>Tu pedido fue enviado correctamente.</p>";
            } catch (error) {
                console.error("❌ Error al guardar el pedido:", error);
                alert("Error al registrar el pedido. Intenta nuevamente.");
            }
        });

        // ❌ Cancelar pedido temporal
        document.getElementById("cancelarPedidoBtn").addEventListener("click", () => {
            localStorage.removeItem("pedidoTemporal");
            location.reload();
        });
    }

    // 🧩 Cargar pedidos guardados en la base de datos
    try {
        const respuesta = await fetch(`http://34.135.37.57/api/usuarios/${usuario.id}/ventas`);
        if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);

        const data = await respuesta.json();
        let pedidos = data.ventas || [];

        pedidos = pedidos.filter(p => p.usuario_id === usuario.id);

        if (pedidos.length === 0) {
            // Si ya hay pedido temporal, no borres el contenido
            if (pedidoTemporal.length === 0) {
                contenedor.innerHTML += "<p>No tienes pedidos registrados.</p>";
            }
            return;
        }

        pedidos.forEach(pedido => {
            const card = document.createElement("div");
            card.classList.add("pedido-card");

            const fechaFormateada = new Date(pedido.fecha).toLocaleString("es-MX", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            const detalles = pedido.detalles || [];
            const detallesHTML = detalles.map(d => `
                <li>
                    ${d.autoparte_id ? "Autoparte ID: " + d.autoparte_id : ""}, 
                    Cantidad: ${d.cantidad}, 
                    Precio unitario: $${d.precio_unitario}, 
                    Subtotal: $${d.subtotal}
                </li>
            `).join("");

            card.innerHTML = `
                <h3>Pedido #${pedido.id}</h3>
                <p><strong>Cliente:</strong> ${pedido.cliente_id ?? "Sin cliente"}</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>Estado:</strong> ${pedido.estado}</p>
                <p><strong>Total:</strong> $${pedido.total}</p>
                <details>
                    <summary>Ver detalles</summary>
                    <ul>${detallesHTML}</ul>
                </details>
            `;

            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        contenedor.innerHTML = `<p class="error">Error al cargar los pedidos. Intenta más tarde.</p>`;
    }
});
