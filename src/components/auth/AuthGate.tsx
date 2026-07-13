import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import styles from "./AuthGate.module.css";

type GateState = "loading" | "ready" | "sending" | "sent" | "error";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<GateState>("loading");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setState("ready");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setState("ready");
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;
    setState("sending");
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setState("error");
      setMessage("无法发送登录链接。请确认这是已获授权的邮箱后重试。");
      return;
    }
    setState("sent");
    setMessage("登录链接已发送到该邮箱。打开邮件并回到 LumiStudio 继续。 ");
  };

  if (state === "loading") {
    return <div className={styles.loading}>正在确认访问权限。</div>;
  }

  if (session) return <>{children}</>;

  return (
    <main className={styles.shell}>
      <section className={styles.intro} aria-labelledby="auth-title">
        <p className={styles.eyebrow}>LumiStudio</p>
        <h1 id="auth-title">回到你的材料与判断。</h1>
        <p>输入已获授权的邮箱。我们会发送一次性登录链接，不需要密码。</p>
      </section>
      <form className={styles.form} onSubmit={(event) => void sendMagicLink(event)}>
        <label htmlFor="auth-email">邮箱</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "ready") setState("ready");
            setMessage("");
          }}
          placeholder="name@example.com"
          required
        />
        <button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "正在发送" : "发送登录链接"}
        </button>
        {message && <p className={state === "error" ? styles.error : styles.status}>{message}</p>}
      </form>
    </main>
  );
}
