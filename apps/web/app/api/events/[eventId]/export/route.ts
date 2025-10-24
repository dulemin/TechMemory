import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import archiver from 'archiver';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    console.log('[Export] Starting export for event:', eventId);
    const supabase = await createClient();

    // 1. Auth-Check: User muss Host des Events sein
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Event laden und Berechtigung prüfen
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, host_user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.host_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Alle approved Beiträge laden
    const { data: contributions, error: contributionsError } = await supabase
      .from('contributions')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (contributionsError) {
      throw contributionsError;
    }

    if (!contributions || contributions.length === 0) {
      console.log('[Export] No approved contributions found');
      return NextResponse.json(
        { error: 'No approved contributions to export' },
        { status: 404 }
      );
    }

    console.log('[Export] Found', contributions.length, 'approved contributions');

    // 4. ZIP-Archive erstellen
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximale Kompression
    });

    // Error-Handling für Archiver
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      throw err;
    });

    // 5. Dateien zum ZIP hinzufügen
    let fileCounter = {
      video: 1,
      photo: 1,
      text: 1
    };

    for (const contribution of contributions) {
      // Type Guard für contribution.type
      const contribType = contribution.type as 'video' | 'photo' | 'text';

      if (contribType === 'text') {
        // Text als .txt-Datei hinzufügen
        const fileName = `${fileCounter.text.toString().padStart(3, '0')}_${contribution.guest_name}.txt`;
        const content = `Von: ${contribution.guest_name}\nDatum: ${new Date(contribution.created_at).toLocaleString('de-DE')}\n\n${contribution.text_content}`;
        archive.append(content, { name: `texts/${fileName}` });
        fileCounter.text++;
      } else if (contribution.content_url) {
        // Video/Foto von Supabase Storage holen
        const urlParts = contribution.content_url.split('/');
        const storagePath = urlParts.slice(urlParts.indexOf('event-media') + 1).join('/');

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('event-media')
          .download(storagePath);

        if (downloadError || !fileData) {
          console.error(`Failed to download ${storagePath}:`, downloadError);
          continue; // Skip this file
        }

        // Extension aus URL extrahieren
        const extension = storagePath.split('.').pop() || (contribType === 'video' ? 'webm' : 'jpg');
        const fileName = `${fileCounter[contribType].toString().padStart(3, '0')}_${contribution.guest_name}.${extension}`;

        // Blob zu Buffer konvertieren
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        archive.append(buffer, { name: `${contribType}s/${fileName}` });
        fileCounter[contribType]++;
      }
    }

    // README hinzufügen
    const readmeContent = `Event: ${event.title}
Export-Datum: ${new Date().toLocaleString('de-DE')}
Anzahl Beiträge: ${contributions.length}

Ordnerstruktur:
- videos/: Video-Nachrichten
- photos/: Foto-Nachrichten
- texts/: Text-Nachrichten

Dateinamen-Format: [Nummer]_[Gastname].[Dateiendung]
`;
    archive.append(readmeContent, { name: 'README.txt' });

    // 6. Archive als Buffer sammeln
    console.log('[Export] Collecting archive data...');
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Warte bis Archive fertig ist
    await new Promise<void>((resolve, reject) => {
      archive.on('end', () => {
        console.log('[Export] Archive finalized');
        resolve();
      });
      archive.on('error', reject);
      archive.finalize();
    });

    // 7. Alle Chunks zu einem Buffer kombinieren
    const buffer = Buffer.concat(chunks);
    console.log('[Export] Final buffer size:', buffer.length, 'bytes');

    const fileName = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Export.zip`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}
