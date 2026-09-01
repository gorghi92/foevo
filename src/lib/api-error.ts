import { NextResponse } from 'next/server'
import { m } from '@/lib/i18n/api'

/**
 * Errore interno da restituire al client.
 *
 * Il dettaglio va nei log della funzione, al chiamante va un messaggio
 * generico: i messaggi di Postgres e di Supabase raccontano nomi di tabelle,
 * colonne, vincoli e a volte pezzi di query — informazione regalata a chi sta
 * sondando l'applicazione, e inutile a chi la sta usando davvero.
 *
 * Gli errori che l'utente può correggere (email già usata, quota esaurita,
 * codice sbagliato) restano quelli espliciti dei dizionari: qui finisce solo
 * ciò che l'utente non può risolvere.
 */
export function serverError(where: string, detail: unknown, status = 500): NextResponse {
  console.error(`[foevo] ${where}`, detail)
  return NextResponse.json({ error: m('internalError') }, { status })
}
