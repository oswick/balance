"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Check } from "lucide-react";

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
import { Product } from "@/types";

const duplicateProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  purchase_price: z.coerce.number().min(0, "Precio de compra no puede ser negativo"),
  selling_price: z.coerce.number().min(0.01, "Precio de venta debe ser mayor a 0"),
  quantity: z.coerce.number().min(1, "Cantidad debe ser al menos 1"),
});

interface ProductDuplicateModalProps {
  product: Product;
  onProductAdded: () => void;
  trigger?: React.ReactNode;
}

export function ProductDuplicateModal({ 
  product, 
  onProductAdded, 
  trigger 
}: ProductDuplicateModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { supabase, user } = useAuth();
  const { toast } = useToast();
  
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof duplicateProductSchema>>({
    resolver: zodResolver(duplicateProductSchema),
    defaultValues: {
      name: `${product.name} (Copia)`,
      purchase_price: product.purchase_price || 0,
      selling_price: product.selling_price,
      quantity: product.quantity,
    },
  });

  // Auto-focus y seleccionar texto cuando se abre
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select(); // Selecciona todo el texto para facilitar edición
        }
      }, 100);
    }
  }, [open]);

  // Reset form cuando cambia el producto
  useEffect(() => {
    form.reset({
      name: `${product.name} (Copia)`,
      purchase_price: product.purchase_price || 0,
      selling_price: product.selling_price,
      quantity: product.quantity,
    });
  }, [product, form]);

  const onSubmit = async (values: z.infer<typeof duplicateProductSchema>) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    const cost_per_unit = values.quantity > 0 ? values.purchase_price / values.quantity : 0;

    const { error } = await supabase
      .from("products")
      .insert([{ 
        ...values, 
        user_id: user.id, 
        cost_per_unit 
      }]);

    if (error) {
      toast({
        title: "Error duplicando producto",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    toast({
      title: "¡Producto duplicado!",
      description: `${values.name} se creó correctamente.`,
      variant: "success",
    });

    onProductAdded();
    setOpen(false);
    setIsSubmitting(false);
  };

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent, nextField?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextField) {
        const nextInput = document.querySelector<HTMLInputElement>(`input[name="${nextField}"]`);
        nextInput?.focus();
      } else {
        form.handleSubmit(onSubmit)();
      }
    }
    
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  // Sugerencias de nombres inteligentes
  const generateNameSuggestions = () => {
    const baseName = product.name.replace(/\s*\((Copia|Copy)\d*\)?\s*$/i, '');
    return [
      `${baseName} Premium`,
      `${baseName} Especial`,
      `${baseName} Grande`,
      `${baseName} Pequeño`,
      `${baseName} V2`,
    ];
  };

  const nameSuggestions = generateNameSuggestions();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="Duplicar producto">
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="dialog-content-centered sm:max-w-md w-[95vw] border-2 border-border shadow-brutal max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Producto
          </DialogTitle>
          <DialogDescription>
            Crea una copia de "{product.name}" con modificaciones
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Campo nombre con sugerencias */}
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
                      placeholder="Nombre del nuevo producto"
                      className="text-base border-2"
                      onKeyDown={(e) => handleKeyDown(e, 'purchase_price')}
                    />
                  </FormControl>
                  
                  {/* Sugerencias rápidas */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {nameSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs touch-manipulation px-2 py-1"
                        onClick={() => form.setValue('name', suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Precios en grid */}
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
                        className="text-base border-2 h-12 touch-manipulation"
                        onKeyDown={(e) => handleKeyDown(e, 'selling_price')}
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
                        className="text-base border-2 h-12 touch-manipulation"
                        onKeyDown={(e) => handleKeyDown(e, 'quantity')}
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
                      className="text-base border-2"
                      onKeyDown={(e) => handleKeyDown(e)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comparación con producto original */}
            <div className="p-3 bg-muted rounded-md text-sm">
              <h4 className="font-medium mb-2">Producto Original:</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Compra:</span>
                  <br />
                  <span className="font-medium">${product.purchase_price?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Venta:</span>
                  <br />
                  <span className="font-medium">${product.selling_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cantidad:</span>
                  <br />
                  <span className="font-medium">{product.quantity}</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 h-12 touch-manipulation"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 touch-manipulation"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Duplicar
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center mt-2">
              <Badge variant="outline" className="text-xs">Enter</Badge> navegar • <Badge variant="outline" className="text-xs">Ctrl + Enter</Badge> crear
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}