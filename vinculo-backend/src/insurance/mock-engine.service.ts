import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockEngineService {
  cotizacionVida(body: any) {
    return {
      cotizacionId: uuidv4(),
      producto: 'Vida Bolívar Plus',
      asegurado: body.nombre || 'Juan Pérez',
      edad: body.edad || 35,
      sumaAsegurada: body.sumaAsegurada || 500000000,
      primaAnual: this.randomBetween(1200000, 3500000),
      primaMensual: this.randomBetween(100000, 300000),
      coberturas: [
        { nombre: 'Muerte por cualquier causa', valor: body.sumaAsegurada || 500000000 },
        { nombre: 'Incapacidad total y permanente', valor: (body.sumaAsegurada || 500000000) * 0.5 },
        { nombre: 'Enfermedades graves', valor: (body.sumaAsegurada || 500000000) * 0.3 },
      ],
      vigencia: { inicio: new Date().toISOString(), fin: this.addYears(1) },
      estado: 'COTIZADO',
      validezDias: 30,
    };
  }

  emisionVida(body: any) {
    return {
      polizaId: uuidv4(),
      numero: `VB-VIDA-${Date.now()}`,
      producto: 'Vida Bolívar Plus',
      estado: 'EMITIDA',
      asegurado: body.nombre || 'Juan Pérez',
      documento: body.documento || '1234567890',
      primaAnual: body.primaAnual || 2400000,
      vigencia: { inicio: new Date().toISOString(), fin: this.addYears(1) },
      documentoUrl: `https://sandbox.vinculo.segurosbolivar.com/docs/${uuidv4()}.pdf`,
    };
  }

  cotizacionAuto(body: any) {
    return {
      cotizacionId: uuidv4(),
      producto: 'Auto Bolívar Total',
      vehiculo: {
        placa: body.placa || 'ABC123',
        marca: body.marca || 'Mazda',
        modelo: body.modelo || 2024,
        linea: body.linea || 'CX-5',
        valorComercial: body.valorComercial || 120000000,
      },
      primaAnual: this.randomBetween(2500000, 5000000),
      primaMensual: this.randomBetween(210000, 420000),
      coberturas: [
        { nombre: 'Pérdida total por hurto', valor: body.valorComercial || 120000000 },
        { nombre: 'Pérdida total por daños', valor: body.valorComercial || 120000000 },
        { nombre: 'Responsabilidad civil', valor: 300000000 },
        { nombre: 'Asistencia en vía 24/7', valor: 'Incluida' },
      ],
      estado: 'COTIZADO',
      validezDias: 15,
    };
  }

  emisionAuto(body: any) {
    return {
      polizaId: uuidv4(),
      numero: `VB-AUTO-${Date.now()}`,
      producto: 'Auto Bolívar Total',
      estado: 'EMITIDA',
      vehiculo: { placa: body.placa || 'ABC123' },
      primaAnual: body.primaAnual || 3500000,
      vigencia: { inicio: new Date().toISOString(), fin: this.addYears(1) },
    };
  }

  consultarPoliza(id: string) {
    return {
      polizaId: id,
      numero: `VB-${Date.now()}`,
      producto: 'Vida Bolívar Plus',
      estado: 'VIGENTE',
      asegurado: 'Juan Pérez',
      primaAnual: 2400000,
      vigencia: { inicio: '2026-01-01', fin: '2027-01-01' },
      coberturas: [
        { nombre: 'Muerte por cualquier causa', valor: 500000000 },
        { nombre: 'Incapacidad total y permanente', valor: 250000000 },
      ],
    };
  }

  reportarSiniestro(body: any) {
    return {
      siniestroId: uuidv4(),
      numero: `SIN-${Date.now()}`,
      polizaId: body.polizaId || uuidv4(),
      tipo: body.tipo || 'ACCIDENTE',
      descripcion: body.descripcion || 'Siniestro reportado vía API',
      estado: 'RADICADO',
      fechaReporte: new Date().toISOString(),
      documentosRequeridos: [
        'Copia de la póliza',
        'Documento de identidad',
        'Informe del evento',
      ],
    };
  }

  estadoSiniestro(id: string) {
    const estados = ['RADICADO', 'EN_REVISION', 'APROBADO', 'EN_PAGO'];
    return {
      siniestroId: id,
      estado: estados[Math.floor(Math.random() * estados.length)],
      ultimaActualizacion: new Date().toISOString(),
      timeline: [
        { estado: 'RADICADO', fecha: '2026-04-10T10:00:00Z', detalle: 'Siniestro radicado' },
        { estado: 'EN_REVISION', fecha: '2026-04-12T14:00:00Z', detalle: 'En revisión por ajustador' },
      ],
    };
  }

  cotizacionHogar(body: any) {
    return {
      cotizacionId: uuidv4(),
      producto: 'Hogar Bolívar Protección',
      direccion: body.direccion || 'Cra 7 #72-41, Bogotá',
      valorInmueble: body.valorInmueble || 350000000,
      primaAnual: this.randomBetween(800000, 2000000),
      coberturas: [
        { nombre: 'Incendio y rayo', valor: body.valorInmueble || 350000000 },
        { nombre: 'Terremoto', valor: body.valorInmueble || 350000000 },
        { nombre: 'Hurto contenidos', valor: 50000000 },
      ],
      estado: 'COTIZADO',
    };
  }

  cotizacionSalud(body: any) {
    return {
      cotizacionId: uuidv4(),
      producto: 'Salud Bolívar Premium',
      beneficiarios: body.beneficiarios || 1,
      primaAnual: this.randomBetween(3000000, 8000000),
      coberturas: [
        { nombre: 'Hospitalización', valor: 200000000 },
        { nombre: 'Cirugía', valor: 150000000 },
        { nombre: 'Medicamentos', valor: 50000000 },
      ],
      estado: 'COTIZADO',
    };
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private addYears(years: number): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString();
  }
}
