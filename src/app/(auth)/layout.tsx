export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-[#F5F7FB] p-4 sm:p-6">
      <div className="pointer-events-none absolute -top-48 -left-32 h-96 w-96 rounded-full bg-blue-500/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
