# Sessions

Sessions connect accepted account credentials to opaque, independently expiring
sessions, so every other request acts as the account that signed in.

Registration [creates an account and starts a session](reaction:Sessions.Register)
for it. [Signing in](reaction:Sessions.SignIn) proves an existing account's
credentials and starts a new session. In both cases, callers cannot choose a
different account.

```endpoints
Sessions.Register at /auth/register
Sessions.SignIn at /auth/sign-in
```

An [active session resolves to its account](reaction:Sessions.CurrentUser), which
the front end uses to show who is signed in.

```endpoints
Sessions.CurrentUser at /auth/current
```

[Signing out ends the session](reaction:Sessions.SignOut). An ended session no
longer grants access to any chart.

```endpoints
Sessions.SignOut at /auth/sign-out
```
