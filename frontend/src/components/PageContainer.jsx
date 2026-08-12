/** La app se usa casi siempre desde el celular en la mesa: layout mobile-first,
 * centrado con un máximo de ancho cómodo si se abre en escritorio. */
export default function PageContainer({ className = "", children }) {
  return (
    <div className={`min-h-dvh w-full flex justify-center ${className}`}>
      <div className="w-full max-w-md px-4 pb-6 sm:pb-10 safe-top">{children}</div>
    </div>
  );
}
