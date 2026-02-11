import { NextResponse } from "next/server"
import { sequelize, User } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request) {
  try {
    const { nombre, email, password, rol = "Comercial" } = await request.json()

    // Validaciones
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Crear usuario
    const newUser = await User.create({
      nombre,
      email,
      password_hash,
      rol,
      activo: false,
    })

    // No devolver el password_hash
    const { password_hash: _, ...userWithoutPassword } = newUser.toJSON()

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}