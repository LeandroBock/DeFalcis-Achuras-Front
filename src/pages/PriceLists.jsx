import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Layers,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  createPriceList,
  deactivatePriceList,
  removePriceListItem,
  setPriceListCustomers,
  setPriceListItem,
  updatePriceList,
} from "../services/api";
import {
  keys,
  useApiMutation,
  useCustomers,
  usePriceList,
  usePriceLists,
} from "../hooks/queries";
import { useAuth } from "../context/AuthContext";
import { formatMoney, roundMoney } from "../utils/format";
import ConfirmModal from "../components/ConfirmModal";
import Modal from "../components/Modal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/PageStates";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-white";

const percentLabel = (value) =>
  value === 0
    ? "Precio normal"
    : `${value > 0 ? "+" : ""}${value}% sobre el normal`;

const normalize = (text) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Listas de precios: cada lista tiene un ajuste general sobre el precio
 * normal (ej: -10%) y, si hace falta, precios fijos por producto. Los
 * clientes asignados pagan el precio de su lista; si además tienen un
 * descuento en un producto (Clientes → precios especiales), se aplica
 * después del de la lista.
 */
function PriceLists() {
  const { user } = useAuth();
  const canEdit = ["super_admin", "admin"].includes(user?.role);

  const listsQuery = usePriceLists();
  const lists = listsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState(null);
  const currentId = selectedId ?? lists[0]?.id ?? null;

  // Ventana "Nueva lista" (se pueden crear todas las que hagan falta).
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const createTitleId = useId();

  function openCreate() {
    setNewName("");
    setNewPercent("");
    setCreating(true);
  }

  const create = useApiMutation(createPriceList, {
    invalidate: [keys.priceLists],
    success: "Lista creada",
  });

  function handleCreate(event) {
    event.preventDefault();
    if (!newName.trim()) {
      toast.error("Escribí el nombre de la lista.");
      return;
    }

    create.mutate(
      {
        name: newName.trim(),
        adjustmentPercent: roundMoney(newPercent || 0),
      },
      {
        onSuccess: (list) => {
          setCreating(false);
          setSelectedId(list.id);
        },
      },
    );
  }

  if (listsQuery.isLoading) {
    return <LoadingState icon={Layers} message="Cargando listas..." />;
  }

  if (listsQuery.error) {
    return (
      <ErrorState
        message="No se pudieron cargar las listas de precios."
        onRetry={listsQuery.refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <Layers className="h-7 w-7" />
            Listas de precios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Precios distintos para grupos de clientes. El descuento por producto
            de cada cliente se aplica después del precio de su lista.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
            Nueva lista
          </button>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* LISTAS */}
        <aside className="space-y-3">
          <ul className="space-y-1">
            {lists.map((list) => (
              <li key={list.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(list.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left transition ${
                    list.id === currentId
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  }`}
                >
                  <p className="font-semibold">{list.name}</p>
                  <p className="text-xs opacity-70">
                    {percentLabel(list.adjustmentPercent)} ·{" "}
                    {list.customerCount}{" "}
                    {list.customerCount === 1 ? "cliente" : "clientes"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* DETALLE */}
        {currentId ? (
          <PriceListDetail
            key={currentId}
            id={currentId}
            canEdit={canEdit}
            onDeactivated={() => setSelectedId(null)}
          />
        ) : (
          <EmptyState
            icon={Layers}
            title="Todavía no hay listas de precios"
            description={
              canEdit
                ? 'Tocá "Nueva lista" para crear la primera (por ejemplo, Mayoristas con -10%).'
                : "Las crea un administrador."
            }
          />
        )}
      </div>

      {creating && (
        <Modal
          as="form"
          onSubmit={handleCreate}
          onClose={() => setCreating(false)}
          closeDisabled={create.isPending}
          labelledBy={createTitleId}
          className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900"
        >
          <h2
            id={createTitleId}
            className="flex items-center gap-2 text-lg font-bold"
          >
            <Layers className="h-5 w-5" />
            Nueva lista de precios
          </h2>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Nombre</span>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ej: Mayoristas"
              maxLength={100}
              required
              data-autofocus
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">
              Ajuste sobre el precio normal (%)
            </span>
            <input
              type="number"
              step="0.01"
              min="-99.99"
              max="999.99"
              value={newPercent}
              onChange={(event) => setNewPercent(event.target.value)}
              placeholder="Ej: -10 (10% menos)"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              Vacío o 0: precio normal. Después podés poner precios fijos por
              producto.
            </span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              {create.isPending ? "Creando..." : "Crear lista"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PriceListDetail({ id, canEdit, onDeactivated }) {
  const listQuery = usePriceList(id);
  const list = listQuery.data;

  const [editingHeader, setEditingHeader] = useState(false);
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [fixedPrice, setFixedPrice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const invalidate = [keys.priceLists];

  const update = useApiMutation((data) => updatePriceList(id, data), {
    invalidate,
    success: "Lista actualizada",
  });
  const saveItem = useApiMutation(
    ({ productId, price }) => setPriceListItem(id, productId, price),
    { invalidate },
  );
  const removeItem = useApiMutation(
    (productId) => removePriceListItem(id, productId),
    { invalidate },
  );
  const deactivate = useApiMutation(() => deactivatePriceList(id), {
    invalidate: [keys.customers],
    success: "Lista desactivada",
  });

  const products = useMemo(() => {
    const query = normalize(productSearch.trim());
    return (list?.products ?? []).filter(
      (product) => !query || normalize(product.productName).includes(query),
    );
  }, [list, productSearch]);

  if (listQuery.isLoading) {
    return <LoadingState message="Cargando lista..." />;
  }

  if (listQuery.error) {
    return (
      <ErrorState
        message={listQuery.error.message}
        onRetry={listQuery.refetch}
      />
    );
  }

  function handleHeader(event) {
    event.preventDefault();
    update.mutate(
      { name: name.trim(), adjustmentPercent: roundMoney(percent || 0) },
      { onSuccess: () => setEditingHeader(false) },
    );
  }

  function handleFixedPrice(event, productId) {
    event.preventDefault();
    const price = roundMoney(fixedPrice);
    if (!(price > 0)) return;

    saveItem.mutate(
      { productId, price },
      { onSuccess: () => setEditingProduct(null) },
    );
  }

  return (
    <section className="min-w-0 space-y-6">
      {/* CABECERA */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {editingHeader ? (
          <form
            onSubmit={handleHeader}
            className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
          >
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Nombre</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                autoFocus
                className={inputClass}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Ajuste (%)</span>
              <input
                type="number"
                step="0.01"
                min="-99.99"
                max="999.99"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
                className={inputClass}
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingHeader(false)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={update.isPending}
                className="flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
              >
                <Save className="h-4 w-4" />
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{list.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {percentLabel(list.adjustmentPercent)} en los productos sin
                precio fijo.
              </p>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setName(list.name);
                    setPercent(String(list.adjustmentPercent));
                    setEditingHeader(true);
                  }}
                  className="flex items-center gap-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold dark:border-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(true)}
                  className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 dark:border-red-900/50 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Desactivar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CLIENTES */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5 text-gray-400" />
            Clientes con esta lista ({list.customers.length})
          </h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => setAssigning(true)}
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900"
            >
              Elegir clientes
            </button>
          )}
        </div>
        {list.customers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ningún cliente usa esta lista todavía.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {list.customers.map((customer) => (
              <span
                key={customer.id}
                className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-950/40 dark:text-purple-200"
              >
                {customer.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* PRODUCTOS */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <h3 className="font-semibold">Precios de la lista</h3>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Buscar producto"
              aria-label="Buscar producto"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3 text-right">Normal</th>
                <th className="px-5 py-3 text-right">En la lista</th>
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product) => (
                <tr key={product.productId}>
                  <td className="px-5 py-2.5 font-medium">
                    {product.productName}
                  </td>
                  <td className="px-5 py-2.5 text-right text-gray-500">
                    {formatMoney(product.normalPrice)}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {editingProduct === product.productId ? (
                      <form
                        onSubmit={(event) =>
                          handleFixedPrice(event, product.productId)
                        }
                        className="flex justify-end gap-1"
                      >
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={fixedPrice}
                          onChange={(event) =>
                            setFixedPrice(event.target.value)
                          }
                          autoFocus
                          data-own-escape
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              setEditingProduct(null);
                            }
                          }}
                          aria-label={`Precio fijo de ${product.productName}`}
                          className={`${inputClass} w-28 text-right`}
                        />
                        <button
                          type="submit"
                          disabled={saveItem.isPending}
                          className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900"
                          aria-label="Guardar"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <strong>{formatMoney(product.price)}</strong>
                        <span className="ml-2 text-xs text-gray-400">
                          {product.fixedPrice !== null ? "fijo" : "por %"}
                        </span>
                      </>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product.productId);
                            setFixedPrice(String(product.price));
                          }}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          aria-label={`Poner precio fijo a ${product.productName}`}
                          title="Precio fijo en esta lista"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {product.fixedPrice !== null && (
                          <button
                            type="button"
                            onClick={() => removeItem.mutate(product.productId)}
                            disabled={removeItem.isPending}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            aria-label={`Quitar precio fijo de ${product.productName}`}
                            title="Volver al % de la lista"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assigning && (
        <AssignCustomersDialog
          list={list}
          onClose={() => setAssigning(false)}
        />
      )}

      <ConfirmModal
        isOpen={confirmDeactivate}
        title="¿Desactivar la lista?"
        message={`Los ${list.customers.length} clientes de "${list.name}" pasan a pagar el precio normal (sus descuentos por producto se mantienen).`}
        onConfirm={() =>
          deactivate.mutate(undefined, {
            onSuccess: () => {
              setConfirmDeactivate(false);
              onDeactivated();
            },
          })
        }
        onCancel={() => setConfirmDeactivate(false)}
        loading={deactivate.isPending}
        confirmText="Desactivar"
      />
    </section>
  );
}

// Elegir con tildes los clientes que se cobran con la lista.
function AssignCustomersDialog({ list, onClose }) {
  const customers = useCustomers().data ?? [];
  const [selected, setSelected] = useState(
    () => new Set(list.customers.map((customer) => customer.id)),
  );
  const [search, setSearch] = useState("");

  const titleId = useId();
  const save = useApiMutation(
    (customerIds) => setPriceListCustomers(list.id, customerIds),
    { invalidate: [keys.customers] },
  );

  const visible = customers.filter(
    (customer) =>
      !search.trim() ||
      normalize(customer.name).includes(normalize(search.trim())),
  );

  function toggle(customerId) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  }

  // Clientes que hoy están en otra lista y se van a pasar a esta.
  const movedFromOther = customers.filter(
    (customer) =>
      selected.has(customer.id) &&
      customer.priceListId &&
      customer.priceListId !== list.id,
  ).length;

  return (
    <Modal
      onClose={onClose}
      closeDisabled={save.isPending}
      labelledBy={titleId}
      className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        <h2 id={titleId} className="font-bold">
          Clientes de {list.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            data-autofocus
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
        {visible.map((customer) => (
          <li key={customer.id}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <input
                type="checkbox"
                checked={selected.has(customer.id)}
                onChange={() => toggle(customer.id)}
                className="h-4 w-4"
              />
              <span className="flex-1 text-sm">{customer.name}</span>
              {customer.priceListId && customer.priceListId !== list.id && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  en otra lista
                </span>
              )}
            </label>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
        {movedFromOther > 0 && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {movedFromOther === 1
              ? "1 cliente deja su lista actual"
              : `${movedFromOther} clientes dejan su lista actual`}{" "}
            y pasa a esta.
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold dark:border-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() =>
              save.mutate([...selected], {
                onSuccess: () => {
                  toast.success(
                    `${selected.size} ${selected.size === 1 ? "cliente" : "clientes"} con la lista ${list.name}`,
                  );
                  onClose();
                },
              })
            }
            className="flex-1 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
          >
            Guardar ({selected.size})
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PriceLists;
