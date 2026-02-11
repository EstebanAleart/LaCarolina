import { NextResponse } from "next/server"
import { sequelize, User } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Verificar si está activo
    if (!user.activo) {
      return NextResponse.json(
        { 
          error: "Tu cuenta está pendiente de aprobación. Un administrador la revisará pronto.",
          pending: true // Flag especial para mostrar mensaje diferente
        },
        { status: 403 }
      )
    }

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date() })

    // No devolver el password_hash
    const { password_hash: _, ...userWithoutPassword } = user.toJSON()

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { error: "Error al iniciar sesión" },
      { status: 500 }
    )
  }
}
