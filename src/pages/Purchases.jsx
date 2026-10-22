import { useMemo, useRef, useState } from "react";
import { ClipboardList, Plus, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

import { deletePurchase, getPurchase } from "../services/api";
import {
  invalidation,
  useApiMutation,
  useProducts,
  usePurchases,
  useSuppliers,
} from "../hooks/queries";
import { usePagination } from "../hooks/usePagination";
import { useShortcut } from "../hooks/useShortcut";
import { useRowNavigation } from "../hooks/useRowNavigation";
import { useFormFocus } from "../hooks/useFormFocus";
import KeyboardHelp from "../components/ui/KeyboardHelp";
import { MOVE } from "../utils/keyboardHelp";
import { formatMoney } from "../utils/format";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/PageStates";
import NewPurchaseForm from "./purchases/NewPurchaseForm";
import EditPurchaseForm from "./purchases/EditPurchaseForm";
import PurchasesTable from "./purchases/PurchasesTable";
import { isCancelled } from "./purchases/shared";

function Purchases() {
  const purchasesQuery = usePurchases();
  const suppliersQuery = useSuppliers();
  const productsQuery = useProducts();

  const purchases = purchasesQuery.data ?? [];
  const suppliers = useMemo(
    () => suppliersQuery.data ?? [],
    [suppliersQuery.data],
  );
  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );

  const { pageItems, ...pagination } = usePagination(purchases);

  const [showForm, setShowForm] = useState(false);

  // { purchase, items } de la compra que se está editando
  const [editing, setEditing] = useState(null);

  const [purchaseToCancel, setPurchaseToCancel] = useState(null);

  // Teclado, como en Clientes: flechas en la tabla, Enter edita, Supr anula,
  // N nueva compra; en los formularios Esc cancela y Ctrl+Enter guarda.
  const newButtonRef = useRef(null);
  const rows = useRowNavigation(pageItems.length, {
    fallbackRef: newButtonRef,
  });
  // Cambia al abrir otra compra: el foco va de nuevo al primer campo.
  const { formRef, rememberFocus, restoreFocus } = useFormFocus(
    editing ? editing.purchase.id : showForm ? "new" : null,
  );

  useShortcut("n", () => openNewForm(), { enabled: !showForm });

  function openNewForm() {
    rememberFocus();
    setEditing(null);
    setShowForm(true);
  }

  function closeForms() {
    setShowForm(false);
    setEditing(null);
    restoreFocus(newButtonRef);
  }

  const cancelPurchase = useApiMutation(deletePurchase, {
    invalidate: invalidation.AFTER_PURCHASE,
    success: "Compra anulada",
  });

  const supplierNames = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );

  function getSupplierName(supplierId) {
    return supplierNames.get(supplierId) || "Proveedor desconocido";
  }

  function loadData() {
    purchasesQuery.refetch();
    suppliersQuery.refetch();
    productsQuery.refetch();
  }

  async function handleEditPurchase(purchase) {
    if (isCancelled(purchase)) {
      toast.error("No se puede editar una compra anulada.");
      return;
    }

    rememberFocus();
    setShowForm(false);

    try {
      const response = await getPurchase(purchase.id);
      const data = response?.data ?? response;
      const fullPurchase = data?.purchase ?? purchase;
      const purchaseItems = Array.isArray(data?.items) ? data.items : [];

      setEditing({
        purchase: fullPurchase,
        items: purchaseItems.map((item) => ({
          productId: item.productId,
          productName:
            products.find((product) => product.id === item.productId)?.name ??
            "Producto",
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      toast.error(error.message);
    }
  }

  function requestCancel(purchase) {
    if (!isCancelled(purchase)) {
      setPurchaseToCancel(purchase);
    }
  }

  function confirmCancelPurchase() {
    if (!purchaseToCancel) return;

    cancelPurchase.mutate(purchaseToCancel.id, {
      onSuccess: () => {
        rows.focusAfterChange();
        setPurchaseToCancel(null);
      },
    });
  }

  function toggleNewForm() {
    if (showForm) closeForms();
    else openNewForm();
  }

  if (
    purchasesQuery.isLoading ||
    suppliersQuery.isLoading ||
    productsQuery.isLoading
  ) {
    return <LoadingState icon={ShoppingCart} message="Cargando compras..." />;
  }

  if (purchasesQuery.error || suppliersQuery.error || productsQuery.error) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos."
        onRetry={loadData}
      />
    );
  }

  return (
    <div>
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-gray-900 p-2 text-white dark:bg-white dark:text-gray-900">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Gestión
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registro de compras a proveedores
          </p>
        </div>

        <button
          type="button"
          ref={newButtonRef}
          onClick={toggleNewForm}
          aria-keyshortcuts={showForm ? undefined : "N"}
          className="flex w-fit items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Nueva compra
            </>
          )}
        </button>
      </header>

      {showForm && (
        <NewPurchaseForm
          suppliers={suppliers}
          products={products}
          formRef={formRef}
          onClose={closeForms}
        />
      )}

      {editing && (
        <EditPurchaseForm
          key={editing.purchase.id}
          purchase={editing.purchase}
          initialItems={editing.items}
          suppliers={suppliers}
          products={products}
          formRef={formRef}
          onClose={closeForms}
        />
      )}

      {/* HISTORIAL */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <ClipboardList className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Historial de compras
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Compras registradas en el sistema.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {purchases.length} {purchases.length === 1 ? "compra" : "compras"}
          </span>
        </div>

        {purchases.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No hay compras registradas"
            description="Cuando registres una compra aparecerá en este historial."
          />
        ) : (
          <PurchasesTable
            purchases={pageItems}
            getSupplierName={getSupplierName}
            onEdit={handleEditPurchase}
            onCancel={requestCancel}
            rowProps={rows.rowProps}
          />
        )}

        {purchases.length > 0 && (
          <KeyboardHelp
            className="border-t border-gray-200 px-5 py-3 dark:border-gray-800"
            items={[
              MOVE,
              [["Enter"], "editar"],
              [["Supr"], "anular"],
              [["N"], "nueva compra"],
            ]}
          />
        )}

        <Pagination {...pagination} />
      </section>

      <ConfirmModal
        isOpen={!!purchaseToCancel}
        title="¿Anular compra?"
        message={
          purchaseToCancel
            ? `¿Querés anular la compra de ${getSupplierName(
                purchaseToCancel.supplierId,
              )} por ${formatMoney(purchaseToCancel.total)}? Se revertirá el stock asociado.`
            : ""
        }
        confirmText="Anular compra"
        loadingText="Anulando..."
        onConfirm={confirmCancelPurchase}
        onCancel={() => setPurchaseToCancel(null)}
        loading={cancelPurchase.isPending}
      />
    </div>
  );
}

export default Purchases;
