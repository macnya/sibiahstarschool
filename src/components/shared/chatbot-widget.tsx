'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from 'react';


export function ChatbotWidget() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; 
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
       <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="lg"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground w-16 h-16 p-0"
            aria-label="Open FAQ Chatbot"
          >
            <MessageSquare className="h-8 w-8" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>FAQ Chatbot</AlertDialogTitle>
            <AlertDialogDescription>
              Our interactive FAQ chatbot is coming soon to help answer your questions instantly!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Okay</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
