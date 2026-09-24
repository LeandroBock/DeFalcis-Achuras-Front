const API_URL = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getFinancialSummary(from, to) {
  const params = new URLSearchParams();

  if (from) {
    params.append('from', from);
  }

  if (to) {
    params.append('to', to);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/reports/financial-summary${query ? `?${query}` : ''}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo obtener el resumen financiero',
    );
  }

  return data;
}

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los productos");
  }

  return response.json();
}

export async function createProduct(productData) {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error del backend:", {
      status: response.status,
      data,
    });

    throw new Error(data.message || "No se pudo crear el producto");
  }

  return data;
}

export async function updateProduct(productId, productData) {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo actualizar el producto");
  }

  return data;
}

export async function deactivateProduct(productId) {
  const response = await fetch(`${API_URL}/products/${productId}/deactivate`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo desactivar el producto");
  }

  return data;
}

export async function getCategories() {
  const response = await fetch(`${API_URL}/categories`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudieron obtener las categorías");
  }

  return data;
}

export async function createCategory(categoryData) {
  const response = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo crear la categoría");
  }

  return data;
}

export async function updateCategory(
  categoryId,
  categoryData,
) {
  const response = await fetch(
    `${API_URL}/categories/${categoryId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(categoryData),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "No se pudo actualizar la categoría",
    );
  }

  return data;
}

export async function deactivateCategory(categoryId) {
  const response = await fetch(
    `${API_URL}/categories/${categoryId}/deactivate`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo desactivar la categoría");
  }

  return data;
}

export async function getCustomers() {
  const response = await fetch(`${API_URL}/customers`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los clientes',
    );
  }

  return data;
}

export async function createCustomer(customerData) {
  const response = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(customerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo crear el cliente',
    );
  }

  return data;
}

export async function updateCustomer(customerId, customerData) {
  const response = await fetch(`${API_URL}/customers/${customerId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(customerData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "No se pudo actualizar el cliente",
    );
  }

  return data;
}

export async function deactivateCustomer(customerId) {
  const response = await fetch(
    `${API_URL}/customers/${customerId}/deactivate`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo desactivar el cliente',
    );
  }

  return data;
}

export async function getSuppliers() {
  const response = await fetch(`${API_URL}/suppliers`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los proveedores',
    );
  }

  return data;
}

export async function createSupplier(supplierData) {
  const response = await fetch(`${API_URL}/suppliers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(supplierData),
  });

  // Si no está OK, manejamos los estados específicos
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('El proveedor ya existe');
    }
    
    // Intentamos leer el mensaje del backend si existe
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo crear el proveedor');
  }

  return await response.json();
}


export async function updateSupplier(
  supplierId,
  supplierData,
) {
  const response = await fetch(
    `${API_URL}/suppliers/${supplierId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(supplierData),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "No se pudo actualizar el proveedor",
    );
  }

  return data;
}

export async function deactivateSupplier(supplierId) {
  const response = await fetch(
    `${API_URL}/suppliers/${supplierId}/deactivate`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo desactivar el proveedor',
    );
  }

  return data;
}

export async function getPurchases() {
  const response = await fetch(`${API_URL}/purchases`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener las compras',
    );
  }

  return data;
}

export async function getPurchase(purchaseId) {
  const response = await fetch(
    `${API_URL}/purchases/${purchaseId}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo obtener la compra',
    );
  }

  return data;
}

export async function createPurchase(purchaseData) {
  const response = await fetch(`${API_URL}/purchases`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(purchaseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo crear la compra',
    );
  }

  return data;
}

export async function getOrders() {
  const response = await fetch(`${API_URL}/orders`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener las ventas',
    );
  }

  return data;
}

export async function getOrder(orderId) {
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo obtener la venta',
    );
  }

  return data;
}

export async function createOrder(orderData) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(orderData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo crear la venta',
    );
  }

  return data;
}

export async function getOrderPayments(orderId) {
  const response = await fetch(
    `${API_URL}/payments/order/${orderId}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        'No se pudieron obtener los pagos',
    );
  }

  return data;
}

export async function createPayment(paymentData) {
  const response = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(paymentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo registrar el pago',
    );
  }

  return data;
}

export async function getExpenses() {
  const response = await fetch(`${API_URL}/expenses`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los gastos',
    );
  }

  return data;
}

export async function createExpense(expenseData) {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(expenseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo crear el gasto',
    );
  }

  return data;
}

export async function getEmployees() {
  const response = await fetch(`${API_URL}/employees`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los empleados',
    );
  }

  return data;
}

export async function createEmployee(employeeData) {
  const response = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo crear el empleado');
  }

  return data;
}

export async function updateEmployee(employeeId, employeeData) {
  const response = await fetch(`${API_URL}/employees/${employeeId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo actualizar el empleado');
  }

  return data;
}

export async function deactivateEmployee(employeeId) {
  const response = await fetch(
    `${API_URL}/employees/${employeeId}/deactivate`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo desactivar el empleado',
    );
  }

  return data;
}

export async function getInventoryMovements() {
  const response = await fetch(`${API_URL}/inventory`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los movimientos',
    );
  }

  return data;
}

export async function createInventoryMovement(movementData) {
  const response = await fetch(`${API_URL}/inventory/movement`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(movementData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo registrar el movimiento',
    );
  }

  return data;
}

export async function getSupplierPayments(purchaseId) {
  const response = await fetch(
    `${API_URL}/supplier-payments/purchase/${purchaseId}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudieron obtener los pagos',
    );
  }

  return data;
}

export async function createSupplierPayment(paymentData) {
  const response = await fetch(
    `${API_URL}/supplier-payments`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo registrar el pago',
    );
  }

  return data;
}

export async function getDashboard() {
  const response = await fetch(`${API_URL}/reports/dashboard`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No se pudo obtener el dashboard');
  }

  return data;
}

export async function getReceivables(from = '', to = '') {
  const params = new URLSearchParams();

  if (from) {
    params.append('from', from);
  }

  if (to) {
    params.append('to', to);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/reports/receivables${query ? `?${query}` : ''}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        'No se pudieron obtener las cuentas por cobrar',
    );
  }

  return data;
}

export async function getPayables(from = '', to = '') {
  const params = new URLSearchParams();

  if (from) {
    params.append('from', from);
  }

  if (to) {
    params.append('to', to);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/reports/payables${query ? `?${query}` : ''}`,
    {
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        'No se pudieron obtener las cuentas por pagar',
    );
  }

  return data;
}

// Agrega esto en tu archivo de servicios API junto a getPurchases, createPurchase, etc.
export async function deletePurchase(id) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/purchases/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al anular la compra');
  }

  return response.json();
}

export async function deactivatePurcheses(purchasesId) {
  const response = await fetch(
    `${API_URL}/purchases/${purchasesId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || 'No se pudo desactivar la compra',
    );
  }

  return data;
}