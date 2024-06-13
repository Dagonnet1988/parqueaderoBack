import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://ascobidi:gQFsdGRtEIcsGbDK@parqueadero.w5fkqft.mongodb.net/', {
  dbName: 'parqueadero',
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error);
});

// Models
const Vehiculo = mongoose.model('Vehiculo', new mongoose.Schema({
  placa: String,
  tipoVehiculo: { type: String, default: 'moto' },
  valorHora: { type: Number, default: 800 },
  cascos: Number,
  puestoCascos: Number,
  tiempoEntrada: {
    type: Date,
    default: () => {
      let date = new Date();
      date.setSeconds(0, 0);
      return date;
    }
  },
  tiempoSalida: Date,
  tiempoTotal: { type: Number, default: 0 },
  valorTotal: { type: Number, default: 0 },
  status: { type: Boolean, default: true },
  codigoBarras: String,
}));

function calcularCosto(tiempoTotal, valorHora) {
  const horas = Math.ceil((tiempoTotal - 5) / 60);
  const costoTotal = horas * valorHora;
  return costoTotal;
};

// Routes
app.post('/vehiculos', async (req, res) => {
  const { placa, tipoVehiculo, cascos, puestoCascos } = req.body;
  const codigoBarras = Math.random().toString(36).substring(2, 15);
  const vehiculo = new Vehiculo({ placa, tipoVehiculo, codigoBarras, cascos, puestoCascos});
  await vehiculo.save();
  res.send(vehiculo);
});

app.get('/vehiculos', async (req, res) => {
  const vehiculos = await Vehiculo.find();
  res.send(vehiculos);
});

app.get('/vehiculos/:codigoBarras', async (req, res) => {
  const { codigoBarras } = req.params;
  const vehiculo = await Vehiculo.findOne({ codigoBarras });
  res.send(vehiculo);
});

app.post('/vehiculos/salida', async (req, res) => {
  const { codigoBarras } = req.body;
  let vehiculo = await Vehiculo.findOne({ codigoBarras });

  if (vehiculo) {
    const tiempoSalida = new Date().setSeconds(0, 0);
    const tiempoTotal = (tiempoSalida - vehiculo.tiempoEntrada) / 60000;

    vehiculo = await Vehiculo.findOneAndUpdate(
      { codigoBarras },
      {
        tiempoSalida: tiempoSalida,
        tiempoTotal: tiempoTotal,
        valorTotal: calcularCosto(tiempoTotal, vehiculo.valorHora),
        status: false,
      },
      { new: true }
    );
  }

  res.send(vehiculo);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
