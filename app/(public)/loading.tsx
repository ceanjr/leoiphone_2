export default function PublicLoading() {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="text-center">
        <div className="relative mx-auto h-12 w-12 animate-pulse">
          <div className="h-full w-full rounded-full border-4 border-zinc-700 opacity-40 brightness-150 grayscale" />
        </div>
        <p className="mt-6 text-sm text-zinc-400">Carregando catálogo...</p>
      </div>
    </div>
  )
}
