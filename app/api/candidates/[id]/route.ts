import { NextRequest, NextResponse } from 'next/server'
import { updateCandidate, deleteCandidate } from '@/lib/data'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const updates = await request.json()
    const candidate = await updateCandidate(id, updates)
    
    if (!candidate) {
      return NextResponse.json(
        { error: '候補者が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(candidate)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await deleteCandidate(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: '候補者が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
