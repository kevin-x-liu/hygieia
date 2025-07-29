import { NextRequest, NextResponse } from "next/server"
import { createUser, validateEmail, validatePassword } from "../../../lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json()

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Email, password, and password confirmation are required" },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(", ") },
        { status: 400 }
      )
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email.toLowerCase().trim(), password)

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Registration error:", error)
    
    if (error && typeof error === 'object' && 'message' in error && error.message === "User with this email already exists") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    )
  }
} 