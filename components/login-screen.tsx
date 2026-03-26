import { loginAction } from "@/app/actions";

export function LoginScreen({ showError }: { showError: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-8 shadow-[0_24px_80px_rgba(77,52,37,0.14)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">AROMA + WAX</p>
        <h1 className="mt-3 text-3xl font-semibold">CLP Label Generator</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Private tool for internal label generation. Enter the shared password to continue.
        </p>

        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {showError ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Incorrect password. Try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[var(--accent-strong)] px-4 py-3 font-medium text-white transition hover:bg-[var(--accent)]"
          >
            Enter tool
          </button>
        </form>
      </section>
    </main>
  );
}
