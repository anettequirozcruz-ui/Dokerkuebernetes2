// ===== VARIABLES GLOBALES DEL CARRITO =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartToggle = document.getElementById('open-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total-amount');
const cartCount = document.querySelector('.cart-count');
const checkoutBtn = document.getElementById('checkout-btn');

// ===== FUNCIONES DEL CARRITO =====
function setupCartEvents() {
    // Botones para agregar al carrito - CORREGIDO
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            const producto = this.getAttribute('data-name');
            const precio = parseFloat(this.getAttribute('data-price'));
            const id = this.getAttribute('data-id');
            const imagen = this.getAttribute('data-image');
            addToCart(id, producto, precio, imagen);
        });
    });

    // Abrir/cerrar carrito
    if (cartToggle) {
        cartToggle.addEventListener('click', function (e) {
            e.preventDefault();
            cartSidebar.classList.add('active');

        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', function () {
            cartSidebar.classList.remove('active');

        });
    }

    // Botón de checkout - CORREGIDO
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            if (cart.length === 0) {
                alert('Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.');
                return;
            }

            // ✅ Guardar carrito como pedido temporal antes de redirigir
            localStorage.setItem("pedidoTemporal", JSON.stringify(cart));

            // Limpiar carrito visualmente si quieres
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));

            // Redirigir a pedidos
            window.location.href = 'pedidos.html';
        });
    }



    // Cerrar carrito al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const id = e.target.dataset.id;
            const nombre = e.target.dataset.product;
            const precio = parseFloat(e.target.dataset.price);
            const imagen = e.target.dataset.image;

            addToCart(id, nombre, precio, imagen);
        }
    });


    // Event delegation para botones de cantidad y eliminar
    if (cartItems) {
        cartItems.addEventListener('click', function (e) {
            const target = e.target;

            // Botón menos
            if (target.classList.contains('minus') || target.closest('.minus')) {
                const button = target.classList.contains('minus') ? target : target.closest('.minus');
                const index = parseInt(button.getAttribute('data-index'));
                updateQuantity(index, -1);
            }

            // Botón más
            if (target.classList.contains('plus') || target.closest('.plus')) {
                const button = target.classList.contains('plus') ? target : target.closest('.plus');
                const index = parseInt(button.getAttribute('data-index'));
                updateQuantity(index, 1);
            }

            // Botón eliminar
            if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
                const button = target.classList.contains('remove-item') ? target : target.closest('.remove-item');
                const index = parseInt(button.getAttribute('data-index'));
                removeFromCart(index);
            }
        });
    }
}

function addToCart(id, producto, precio, imagen) {
    console.log('Agregando al carrito:', producto, precio);

    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        cart.push({
            id: id,
            producto: producto,
            precio: precio,
            imagen: imagen,
            cantidad: 1
        });
    }

    updateCart();
    showNotification(`${producto}, agregado al carrito`);
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const productoEliminado = cart[index].producto;
        cart.splice(index, 1);
        updateCart();
        showNotification(`${productoEliminado} eliminado del carrito`);
    }
}

function updateQuantity(index, change) {
    if (index >= 0 && index < cart.length) {
        cart[index].cantidad += change;

        if (cart[index].cantidad <= 0) {
            removeFromCart(index);
        } else {
            updateCart();
        }
    }
}

function updateCart() {
    // Actualizar contador
    const totalItems = cart.reduce((total, item) => total + item.cantidad, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Actualizar lista de productos en el carrito
    if (cartItems) {
        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        } else {
            // Mostrar productos
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.producto}</h4>
                        <p>$${item.precio} MXN</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <span class="item-quantity">${item.cantidad}</span>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                        <button class="remove-item" data-index="${index}" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                cartItems.appendChild(cartItem);
            });
        }
    }

    // Actualizar total
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        cartTotal.textContent = `${total.toFixed(2)} MXN`;
    }

    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

async function saveOrder() {
    if (cart.length === 0) return;

    // Recuperar usuario logeado (por ejemplo, guardado en localStorage)
    const usuarioLogeado = JSON.parse(localStorage.getItem('usuario'));
    if (!usuarioLogeado || !usuarioLogeado.id) {
        alert("Error: No se encontró el usuario logeado.");
        return;
    }

    // Construcción del pedido según el formato de tu API
    const pedido = {
        cliente_id: null,
        usuario_id: usuarioLogeado.id, // 🔥 se registra el usuario que inició sesión
        estado: "pendiente",
        total: cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
        detalles: cart.map(item => ({
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

        // Limpiar carrito
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));

        showNotification("Pedido registrado exitosamente.");
        setTimeout(() => {
            window.location.href = 'pedidos.html';
        }, 1500);

    } catch (error) {
        console.error("❌ Error al guardar el pedido:", error);
        showNotification("Error al registrar el pedido. Intenta nuevamente.");
    }
}

function showNotification(message) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inicializar carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    setupCartEvents();
    updateCart(); // Actualizar carrito al cargar la página

    // Wishlist
    const wishlistButtons = document.querySelectorAll('.wishlist');
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function () {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                icon.style.color = 'var(--secondary)';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                icon.style.color = 'var(--gray)';
            }
        });
    });

    // Menú móvil
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    if (mobileMenu && nav) {
        mobileMenu.addEventListener('click', function () {
            if (nav.style.display === 'flex') {
                nav.style.display = 'none';
            } else {
                nav.style.display = 'flex';
                nav.style.flexDirection = 'column';
                nav.style.position = 'absolute';
                nav.style.top = '70px';
                nav.style.right = '15px';
                nav.style.background = 'var(--primary)';
                nav.style.padding = '20px';
                nav.style.borderRadius = '8px';
                nav.style.boxShadow = 'var(--shadow)';
            }
        });
    }
});