# Supabase email templates — ShelfPOS

Paste these in **Supabase Dashboard → Authentication → Email Templates**.

Also set **Authentication → URL Configuration**:

| Field | Value |
|-------|--------|
| **Site URL** | Your dashboard origin, e.g. `https://admin.yourdomain.com` or `http://localhost:3000` |
| **Redirect URLs** | Same origin + `/login`, `/accept-invite`, and `/reset-password` |

---

## Invite user

**Subject:**

```
Invitación a ShelfPOS — cree su cuenta de dueño
```

**Body:** use `invite-user.html` in this folder.

---

## Confirm signup (optional)

**Subject:**

```
Confirme su correo — ShelfPOS
```

**Body:** use `confirm-signup.html`.

---

## Reset password

Used when the **operator** sends a password reset for an existing owner (`Portal de operador → Restablecer contraseña`).

**Subject:**

```
Restablecer contraseña — ShelfPOS
```

**Body:** use `reset-password.html`.

---

## Variables (Supabase Go templates)

| Variable | Use |
|----------|-----|
| `{{ .ConfirmationURL }}` | Main action link (invite / confirm / reset) |
| `{{ .Email }}` | Recipient email |
| `{{ .SiteURL }}` | Site URL from auth settings |
| `{{ .RedirectTo }}` | Redirect passed when invite was generated |

Disable **email tracking** on your SMTP provider so links are not rewritten.
