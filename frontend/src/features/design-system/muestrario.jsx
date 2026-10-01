import { Leaf, Mountain, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Price } from '@/components/ui/price';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/ui/stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';

// Precios de ejemplo tal como los devolvería la API para cada moneda (?moneda=).
const PRECIOS_DEMO = { PEN: 48, USD: 12.8, EUR: 11.9 };
const ENVIO_POR_PAIS = { PE: 15, DE: 128.5, US: 142 };

function Grupo({ titulo, children }) {
  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{titulo}</h3>
      {children}
    </div>
  );
}

export function Muestrario() {
  const { t } = useTranslation();
  const [cantidad, setCantidad] = useState(2);
  const [paso, setPaso] = useState(1);
  const [pais, setPais] = useState('PE');
  const [cargando, setCargando] = useState(false);

  const pasos = ['envio', 'metodo', 'pago', 'confirmar'].map((id) => ({
    id,
    label: t(`checkout.pasos.${id}`),
  }));

  const simularPago = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      toast.success('Pago aprobado', { description: 'Operación N.º 004812 · Yape' });
    }, 1200);
  };

  return (
    <div className="grid gap-10">
      <Grupo titulo="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Explorar catálogo</Button>
          <Button variant="secondary">Ver origen</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="link">Política de envíos</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="lg">
            <ShoppingBag aria-hidden="true" /> Agregar
          </Button>
          <Button size="icon" aria-label="Agregar al carrito">
            <Plus aria-hidden="true" />
          </Button>
          <Button loading={cargando} onClick={simularPago}>
            {cargando ? 'Procesando…' : 'Pagar (simulado)'}
          </Button>
          <Button disabled>Deshabilitado</Button>
          <Button variant="destructive" size="sm">
            Eliminar
          </Button>
        </div>
      </Grupo>

      <Grupo titulo="Input · Field · Select">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" hint="Como figura en tu documento.">
            <Input placeholder="María Quispe" autoComplete="name" />
          </Field>
          <Field label="Correo" error="Ingresa un correo válido.">
            <Input type="email" defaultValue="maria@" />
          </Field>
          <Field label="País de destino">
            {(props) => (
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger {...props}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PE">Perú</SelectItem>
                  <SelectItem value="DE">Alemania</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Deshabilitado">
            <Input disabled placeholder="No editable" />
          </Field>
        </div>
      </Grupo>

      <Grupo titulo="Price (moneda activa) · recálculo animado">
        <div className="flex flex-wrap items-end gap-6">
          <Price amount={48} currency="PEN" size="xl" />
          <Price amount={12.8} currency="USD" size="lg" compareAt={15} />
          <Price amount={11.9} currency="EUR" />
        </div>
        <p className="flex flex-wrap items-baseline gap-2 text-sm text-muted-foreground">
          Envío a {pais} (cambia el país arriba):
          <Price amount={ENVIO_POR_PAIS[pais]} currency="PEN" animate className="text-foreground" />
        </p>
      </Grupo>

      <Grupo titulo="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge variant="verde">
            <Leaf aria-hidden="true" /> Orgánico
          </Badge>
          <Badge variant="maiz">Comercio justo</Badge>
          <Badge variant="primary">Nuevo</Badge>
          <Badge>
            <Mountain aria-hidden="true" /> 3,400 msnm
          </Badge>
          <Badge variant="outline">Pendiente</Badge>
          <Badge variant="destructive">Sin stock</Badge>
        </div>
      </Grupo>

      <Grupo titulo="Card · QuantitySelector">
        <Card interactive className="max-w-sm">
          <div className="aspect-4/3 overflow-hidden bg-secondary">
            <img
              src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=640&q=70"
              alt="Granos de café tostado"
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
          <CardHeader>
            <p className="text-sm text-muted-foreground">1,600 msnm · Huayopata</p>
            <CardTitle>Café orgánico de altura</CardTitle>
            <CardDescription>Tostado medio, notas de cacao y panela. 250 g.</CardDescription>
          </CardHeader>
          <CardContent>
            <Price amount={PRECIOS_DEMO.PEN} currency="PEN" size="lg" />
          </CardContent>
          <CardFooter className="justify-between">
            <QuantitySelector value={cantidad} onChange={setCantidad} max={12} size="sm" />
            <Button
              size="sm"
              onClick={() =>
                toast.success(t('carrito.agregado'), { description: `${cantidad} × Café orgánico` })
              }
            >
              Agregar
            </Button>
          </CardFooter>
        </Card>
      </Grupo>

      <Grupo titulo="Stepper (clic en pasos completados para volver)">
        <Stepper steps={pasos} current={paso} onStepClick={setPaso} />
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPaso((p) => Math.max(0, p - 1))}>
            Atrás
          </Button>
          <Button size="sm" onClick={() => setPaso((p) => Math.min(pasos.length - 1, p + 1))}>
            Siguiente
          </Button>
        </div>
      </Grupo>

      <Grupo titulo="Tabs">
        <Tabs defaultValue="descripcion">
          <TabsList>
            <TabsTrigger value="descripcion">Descripción</TabsTrigger>
            <TabsTrigger value="origen">Origen</TabsTrigger>
            <TabsTrigger value="resenas">Reseñas (24)</TabsTrigger>
          </TabsList>
          <TabsContent value="descripcion">
            <p className="text-sm text-muted-foreground">
              Café arábica típica y bourbon cultivado bajo sombra en el valle de La Convención.
            </p>
          </TabsContent>
          <TabsContent value="origen">
            <p className="text-sm text-muted-foreground">Huayopata, La Convención · 1 800 msnm.</p>
          </TabsContent>
          <TabsContent value="resenas">
            <p className="text-sm text-muted-foreground">★★★★★ «Aroma increíble» — Anna B.</p>
          </TabsContent>
        </Tabs>
      </Grupo>

      <Grupo titulo="Skeleton">
        <div className="flex max-w-sm gap-4">
          <Skeleton className="size-20 shrink-0" />
          <div className="grid flex-1 content-center gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </Grupo>

      <Grupo titulo="Dialog · Drawer · Toast">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Cancelar el pedido?</DialogTitle>
                <DialogDescription>
                  El pedido KSK-000123 se cancelará y el stock volverá al inventario.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Volver</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive">Cancelar pedido</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Abrir drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t('carrito.titulo')}</DrawerTitle>
                <DrawerDescription>2 productos</DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="grid content-start gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="size-16" />
                    <div className="grid flex-1 content-center gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </DrawerBody>
              <DrawerFooter>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <Price amount={96} size="lg" />
                </div>
                <Button size="lg">Ir al checkout</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <Button
            variant="ghost"
            onClick={() =>
              toast.error('Pago rechazado', {
                description: 'La tarjeta terminada en 0002 fue rechazada.',
              })
            }
          >
            Toast de error
          </Button>
          <Button
            variant="ghost"
            onClick={() => toast('Tipo de cambio actualizado', { description: '1 EUR = 4.05 PEN' })}
          >
            Toast informativo
          </Button>
        </div>
      </Grupo>
    </div>
  );
}
