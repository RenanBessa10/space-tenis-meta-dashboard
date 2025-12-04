import app from './app.js'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Dashboard rodando em http://localhost:${PORT}`)
})
import analisePrecosRoutes from "./routes/analisePrecos.js";
app.use("/api/analise-precos", analisePrecosRoutes);
