'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Printer, Download, ScanLine } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function GymQRCodeClient({ gymId, gymName }: { gymId: string, gymName: string }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    // Generate the URL dynamically based on where the app is deployed
    const host = window.location.origin
    const deepLink = `${host}/member/scan?gym_id=${gymId}`
    
    // Using a reliable public API to generate the QR image so we don't need heavy dependencies
    const qrImageSource = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(deepLink)}`
    setQrUrl(qrImageSource)
  }, [gymId])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen pb-12 bg-zinc-50/50 dark:bg-zinc-950 print:bg-white print:m-0 print:p-0">
      
      {/* Hide Header when Printing */}
      <div className="border-b bg-background print:hidden">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">QR Code Check-In</h1>
          <p className="text-muted-foreground text-sm mt-1">Print this QR code and paste it at your reception.</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-4 flex items-center justify-center print:m-0 print:-mt-8">
        
        <Card className="shadow-lg border-2 border-primary/10 max-w-md w-full print:border-none print:shadow-none">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-primary">{gymName}</CardTitle>
            <CardDescription className="text-base font-semibold">Self-Service Check-in</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8 space-y-8">
            
            <div className="relative">
              {/* Corner brackets design for aesthetic */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {qrUrl ? (
                <img 
                  src={qrUrl} 
                  alt="Gym QR Code" 
                  className="w-64 h-64 object-contain shadow-sm border rounded-xl"
                />
              ) : (
                <div className="w-64 h-64 bg-muted animate-pulse rounded-xl flex items-center justify-center">
                  <ScanLine className="w-10 h-10 text-muted-foreground opacity-50" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-lg">Scan to mark attendance</p>
              <p className="text-sm text-muted-foreground">Apne phone ka normal camera open karein aur scan karein.</p>
            </div>

            <div className="flex gap-4 w-full print:hidden pt-4">
              <Button onClick={handlePrint} className="w-full" size="lg">
                <Printer className="mr-2 w-5 h-5" /> Print QR
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
