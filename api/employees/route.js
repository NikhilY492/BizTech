// pages/api/employees.js (if using Pages Router)
// OR
// app/api/employees/route.js (if using App Router)


import clientPromise from '../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("biztech_db");
    
    const users = await db.collection("users").find({}).toArray();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees data' }, { status: 500 });
  }
}
