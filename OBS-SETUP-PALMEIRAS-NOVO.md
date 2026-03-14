# 📺 OBS Setup — Palmeiras x Novorizontino (Final Paulistão)

**Fixture ID:** `1528824`
**Base URL:** `https://union-football-connect.vercel.app`

---

## 🎮 Admin (abrir no navegador)

```
https://union-football-connect.vercel.app/admin/bolinha
```

---

## 📺 Widgets OBS

Todas as URLs têm fundo transparente, sem header/footer.
Adicionar no OBS como **Browser Source**.

---

### 🎾 Bolinha (mascote com legenda e áudio)
```
https://union-football-connect.vercel.app/obs/bolinha?size=md
```
> Tamanhos: `sm` (200px), `md` (300px), `lg` (400px)

---

### ⚽ Placar
```
https://union-football-connect.vercel.app/obs/placar?fixture=1528824
```

---

### 📊 Estatísticas
```
https://union-football-connect.vercel.app/obs/stats?fixture=1528824
```
> Variações: `&widget=full` | `&widget=top` | `&widget=bottom`

---

### 📋 Eventos (gols, cartões, substituições)
```
https://union-football-connect.vercel.app/obs/eventos?fixture=1528824
```

---

### 🟢 Campo virtual
```
https://union-football-connect.vercel.app/obs/campo?fixture=1528824
```

---

### 📋 Escalações
```
https://union-football-connect.vercel.app/obs/escalacao?fixture=1528824
```

---

### 🏆 Classificação
```
https://union-football-connect.vercel.app/obs/classificacao?fixture=1528824
```

---

### 🔮 Predições
```
https://union-football-connect.vercel.app/obs/predicao?fixture=1528824
```

---

### ⚔️ H2H (confrontos diretos)
```
https://union-football-connect.vercel.app/obs/h2h?fixture=1528824
```

---

### 🏥 Desfalques / Lesões
```
https://union-football-connect.vercel.app/obs/desfalques?fixture=1528824
```

---

### 🗳️ Enquete
```
https://union-football-connect.vercel.app/obs/enquete?pergunta=Quem+leva+a+final?&opcao1=Palmeiras&opcao2=Novorizontino
```

---

## 🔧 Widgets individuais (opcionais)

| Widget | URL |
|--------|-----|
| Liga | `https://union-football-connect.vercel.app/obs/liga?fixture=1528824` |
| Time Casa | `https://union-football-connect.vercel.app/obs/home?fixture=1528824` |
| Time Fora | `https://union-football-connect.vercel.app/obs/away?fixture=1528824` |
| Placar simples | `https://union-football-connect.vercel.app/obs/score?fixture=1528824` |
| Tempo de jogo | `https://union-football-connect.vercel.app/obs/tempo?fixture=1528824` |
| Notas jogadores | `https://union-football-connect.vercel.app/obs/ratings?fixture=1528824` |

---

## ⚙️ Config no OBS

1. **Adicionar fonte** → Browser Source
2. **URL** → colar a URL desejada
3. **Largura** → 1920 (ajustar por widget)
4. **Altura** → 1080 (ajustar por widget)
5. **Custom CSS** → deixar vazio
6. **"Shutdown source when not visible"** → desligado
7. **"Refresh browser when scene becomes active"** → ligado
