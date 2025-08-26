"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Zap, Coffee, Package, ShoppingBag, Utensils } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-provider";
import { useToast } from "@/hooks/use-toast";

// Esquema de validación optimizado
const quickProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  purchase_price: z.coerce.number().min(0, "Precio de compra no puede ser negativo"),
  selling_price: z.coerce.number().min(0.01, "Precio de venta debe ser mayor a 0"),
  quantity: z.coerce.number().min(1, "Cantidad debe ser al menos 1"),
});

// Plantillas de productos por tipo de negocio
const BUSINESS_TEMPLATES = {
  'coffee shop': [
    { name: "Café Americano", purchase_price: 0.80, selling_price: 3.50, quantity: 1 },
    { name: "Cappuccino", purchase_price: 1.20, selling_price: 4.50, quantity: 1 },
    { name: "Latte", purchase_price: 1.30, selling_price: 4.80, quantity: 1 },
    { name: "Croissant", purchase_price: 1.50, selling_price: 3.20, quantity: 10 },
    { name: "Muffin", purchase_price: 1.80, selling_price: 3.80, quantity: 8 },
  ],
  'panadería': [
    { name: "Pan Integral", purchase_price: 1.20, selling_price: 2.50, quantity: 20 },
    { name: "Baguette", purchase_price: 1.50, selling_price: 3.00, quantity: 15 },
    { name: "Croissant", purchase_price: 1.20, selling_price: 2.80, quantity: 12 },
    { name: "Pan Dulce", purchase_price: 0.80, selling_price: 1.80, quantity: 25 },
    { name: "Torta", purchase_price: 8.00, selling_price: 18.00, quantity: 1 },
  ],
  'bakery': [
    { name: "Artisan Bread", purchase_price: 2.00, selling_price: 4.50, quantity: 12 },
    { name: "Sourdough", purchase_price: 2.50, selling_price: 5.50, quantity: 8 },
    { name: "Bagel", purchase_price: 0.60, selling_price: 1.50, quantity: 24 },
    { name: "Danish", purchase_price: 1.80, selling_price: 3.50, quantity: 10 },
    { name: "Wedding Cake", purchase_price: 25.00, selling_price: 65.00, quantity: 1 },
  ],
  'restaurant': [
    { name: "Hamburguesa Clásica", purchase_price: 4.50, selling_price: 12.00, quantity: 1 },
    { name: "Pizza Margarita", purchase_price: 3.20, selling_price: 9.50, quantity: 1 },
    { name: "Ensalada César", purchase_price: 2.80, selling_price: 8.50, quantity: 1 },
    { name: "Pasta Carbonara", purchase_price: 3.50, selling_price: 11.00, quantity: 1 },
    { name: "Cerveza", purchase_price: 1.50, selling_price: 4.50, quantity: 24 },
  ],
  'tienda': [
    { name: "Agua 500ml", purchase_price: 0.30, selling_price: 0.75, quantity: 48 },
    { name: "Refresco Lata", purchase_price: 0.60, selling_price: 1.25, quantity: 24 },
    { name: "Chocolate Bar", purchase_price: 0.80, selling_price: 1.80, quantity: 20 },
    { name: "Galletas Pack", purchase_price: 1.20, selling_price: 2.50, quantity: 15 },
    { name: "Cigarrillos", purchase_price: 4.00, selling_price: 6.50, quantity: 10 },
  ],
  'default': [
    { name: "Producto Ejemplo 1", purchase_price: 2.00, selling_price: 4.00, quantity: 10 },
    { name: "Producto Ejemplo 2", purchase_price: 5.00, selling_price: 8.50, quantity: 5 },
    { name: "Producto Ejemplo 3", purchase_price: 1.50, selling_price: 3.20, quantity: 20 },
  ]
};

const BUSINESS_ICONS = {
  'coffee shop': Coffee,
  'panadería': Package,
  'bakery': Package,
  'restaurant': Utensils,
  'tienda': ShoppingBag,
  'default': Package,
};

interface QuickAddProductModalProps {
  onProductAdded: () => void;
  businessType?: string;
}

export function QuickAddProductModal({ 
  onProductAdded, 
  businessType = 'default' 
}: QuickAddProductModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'template'>('template');
  const [addAnother, setAddAnother] = useState(false);
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof quickProductSchema>>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      name: "",
      purchase_price: 0,
      selling_price: 0,
      quantity: 1,
    },
  });

  // Auto-focus cuando se abre el modal
  useEffect(() => {
    if (open && mode === 'manual') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open, mode]);

  // Obtener plantillas para el tipo de negocio
  const templates = BUSINESS_TEMPLATES[businessType as keyof typeof BUSINESS_TEMPLATES] || BUSINESS_TEMPLATES.default;
  const BusinessIcon = BUSINESS_ICONS[businessType as keyof typeof BUSINESS_ICONS] || BUSINESS_ICONS.default;

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof quickProductSchema>) => {
    if (!user) return;

    const cost_per_unit = values.quantity > 0 ? values.purchase_price / values.quantity : 0;

    const { error } = await supabase
      .from("products")
      .insert([{ ...values, user_id: user.id, cost_per_unit }]);

    if (error) {
      toast({
        title: "Error agregando producto",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Producto agregado!",
      description: `${values.name} se agregó correctamente.`,
      variant: "success",
    });

    onProductAdded();

    if (addAnother) {
      // Limpiar formulario pero mantener modal abierto
      form.reset({
        name: "",
        purchase_price: values.purchase_price, // Mantener precio de compra para agilizar
        selling_price: 0,
        quantity: values.quantity, // Mantener cantidad
      });
      setTimeout(() => nameInputRef.current?.focus(), 100);
    } else {
      setOpen(false);
      form.reset();
    }
  };

  // Usar plantilla
  const useTemplate = (template: typeof templates[0]) => {
    form.setValue("name", template.name);
    form.setValue("purchase_price", template.purchase_price);
    form.setValue("selling_price", template.selling_price);
    form.setValue("quantity", template.quantity);
    setMode('manual');
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  // Manejar teclas para agilizar navegación
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        form.reset();
        setMode('template');
        setAddAnother(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Agregar Rápido
        </Button>
      </DialogTrigger>
      
      <DialogContent className="dialog-content-centered sm:max-w-lg w-[95vw] border-2 border-border shadow-brutal max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Agregar Producto Rápido
          </DialogTitle>
          <DialogDescription>
            {mode === 'template' 
              ? 'Selecciona una plantilla o ingresa manualmente' 
              : 'Usa Tab/Enter para navegar. Ctrl+Enter para guardar.'
            }
          </DialogDescription>
        </DialogHeader>

        {mode === 'template' ? (
          <div className="space-y-4">
            {/* Header de tipo de negocio */}
            <div className="flex items-center gap-2 p-3 bg-accent rounded-md">
              <BusinessIcon className="h-5 w-5" />
              <span className="font-medium capitalize">
                {businessType === 'default' ? 'Plantillas Generales' : businessType}
              </span>
            </div>

            {/* Plantillas */}
            <div className="space-y-2 max-h-[50vh] md:max-h-60 overflow-y-auto">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => useTemplate(template)}
                  className="w-full text-left p-3 border-2 border-border hover:bg-accent rounded-md transition-colors touch-manipulation"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">{template.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Cantidad: {template.quantity}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium">
                        Venta: ${template.selling_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Compra: ${template.purchase_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Botón manual */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setMode('manual')}
                className="flex-1 h-12 touch-manipulation"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ingreso Manual
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={handleKeyDown}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        ref={nameInputRef}
                        placeholder="Ej: Pan Integral"
                        className="text-base border-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.querySelector<HTMLInputElement>('input[name="purchase_price"]')?.focus();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Precio Compra</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          name="purchase_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="text-base border-2 h-12 touch-manipulation"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.querySelector<HTMLInputElement>('input[name="selling_price"]')?.focus();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Precio Venta</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          name="selling_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="text-base border-2 h-12 touch-manipulation"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              document.querySelector<HTMLInputElement>('input[name="quantity"]')?.focus();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Inicial</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        name="quantity"
                        type="number"
                        placeholder="1"
                        className="text-base border-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Opción de agregar otro */}
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md touch-manipulation">
                <input
                  type="checkbox"
                  id="addAnother"
                  checked={addAnother}
                  onChange={(e) => setAddAnother(e.target.checked)}
                  className="h-4 w-4 touch-manipulation"
                />
                <label htmlFor="addAnother" className="text-sm cursor-pointer">
                  Agregar otro producto después
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('template')}
                  className="flex-1 h-12 touch-manipulation"
                >
                  ← Plantillas
                </Button>
                <Button type="submit" className="flex-1 h-12 touch-manipulation">
                  {addAnother ? 'Guardar + Nuevo' : 'Guardar'}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center mt-2">
                <Badge variant="outline" className="text-xs">Ctrl + Enter</Badge> para guardar rápido
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}