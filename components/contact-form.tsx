"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2 } from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  pharmacyName: z.string().min(2, "Pharmacy name must be at least 2 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  gstin: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const { toast } = useToast()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  // Reset form state on component mount (page refresh)
  useEffect(() => {
    reset()
    setIsSubmitted(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message")
      }

      // Show success state
      setIsSubmitted(true)
      
      // Show success toast
      toast({
        title: "Message sent successfully!",
        description: "Thank you for your interest. We'll get back to you soon.",
      })

      // Reset form
      reset()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    }
  }

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Thank You!</h3>
              <p className="text-muted-foreground max-w-md">
                Your message has been sent successfully. We&apos;ll get back to you as soon as possible.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false)
                reset()
              }}
              className="mt-4"
            >
              Send Another Message
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Sales</CardTitle>
        <CardDescription>
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+91 9876543210"
                aria-invalid={errors.phone ? "true" : "false"}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacyName">
                Pharmacy Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pharmacyName"
                {...register("pharmacyName")}
                placeholder="ABC Pharmacy"
                aria-invalid={errors.pharmacyName ? "true" : "false"}
              />
              {errors.pharmacyName && (
                <p className="text-sm text-destructive">{errors.pharmacyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Mumbai"
                aria-invalid={errors.city ? "true" : "false"}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="Maharashtra"
                aria-invalid={errors.state ? "true" : "false"}
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <Input
              id="gstin"
              {...register("gstin")}
              placeholder="27AAAAA0000A1Z5"
              aria-invalid={errors.gstin ? "true" : "false"}
            />
            {errors.gstin && (
              <p className="text-sm text-destructive">{errors.gstin.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="message"
              {...register("message")}
              rows={5}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell us about your requirements..."
              aria-invalid={errors.message ? "true" : "false"}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}