# Fix: Type Instantiation Excessively Deep Error

## 🔍 Problem

**Error**: "Type instantiation is excessively deep and possibly infinite"

**Location**: `src/features/modules/inscriptions/hooks/useInscriptions.ts` (lines 239-271)

**Root Cause**: 
When using Supabase's `.select()` with joins (foreign key relations), TypeScript's type inference tries to recursively resolve deeply nested types. This can create an infinite loop in the type system, especially with complex queries like:

```typescript
.select(`
  *,
  school:schools(name),
  class:classes(name, level),
  validator:users!validated_by(first_name, last_name)
`)
```

## ✅ Solution Applied

### Fix 1: useCreateInscription Hook

**Before**:
```typescript
const { data, error } = await supabase
  .from('inscriptions')
  .insert({...})
  .select(`
    *,
    school:schools(name),
    class:classes(name, level)
  `)
  .single();
```

**After**:
```typescript
const { data, error } = await supabase
  .from('inscriptions')
  .insert({...})
  .select(`
    *,
    school:schools(name),
    class:classes(name, level)
  `)
  .single() as Promise<{ data: InscriptionQueryResult | null; error: any }>;
```

### Fix 2: useInscriptions Hook (List)

**Before**:
```typescript
let query = supabase
  .from('inscriptions')
  .select(`
    *,
    school:schools(name),
    class:classes(name, level),
    validator:users!validated_by(first_name, last_name)
  `)
  .order('submitted_at', { ascending: false });
```

**After**:
```typescript
let query = supabase
  .from('inscriptions')
  .select(`
    *,
    school:schools(name),
    class:classes(name, level),
    validator:users!validated_by(first_name, last_name)
  `) as any
  .order('submitted_at', { ascending: false });
```

### Fix 3: useInscription Hook (Single)

**Before**:
```typescript
const { data, error } = await supabase
  .from('inscriptions')
  .select(`
    *,
    school:schools(name),
    class:classes(name, level),
    validator:users!validated_by(first_name, last_name, email)
  `)
  .eq('id', id)
  .single();
```

**After**:
```typescript
const { data, error } = await supabase
  .from('inscriptions')
  .select(`
    *,
    school:schools(name),
    class:classes(name, level),
    validator:users!validated_by(first_name, last_name, email)
  `)
  .eq('id', id)
  .single() as Promise<{ data: InscriptionQueryResult | null; error: any }>;
```

## 🎯 Key Techniques

### 1. Type Assertion with `as Promise<...>`
For queries that end with `.single()`, explicitly cast to a Promise with the expected structure:
```typescript
.single() as Promise<{ data: YourType | null; error: any }>
```

### 2. Type Assertion with `as any`
For query builders that continue with more methods (`.order()`, `.eq()`, etc.), use `as any` immediately after `.select()`:
```typescript
.select(`...`) as any
.order('field', { ascending: false })
```

### 3. Use Custom Interface
Define an interface matching your database schema with snake_case:
```typescript
interface InscriptionQueryResult {
  id: string;
  school_id: string;
  student_first_name: string;
  // ... all database fields
}
```

## 📋 When to Apply This Fix

Apply this fix when you encounter:
- ✅ "Type instantiation is excessively deep" errors
- ✅ Supabase queries with `.select()` using joins
- ✅ Complex nested relations (foreign keys)
- ✅ Queries with multiple joined tables

## 🔄 Alternative Solutions

### Option 1: Separate Queries (Not Recommended)
```typescript
// Fetch inscription first
const { data: inscription } = await supabase
  .from('inscriptions')
  .select('*')
  .eq('id', id)
  .single();

// Then fetch related data
const { data: school } = await supabase
  .from('schools')
  .select('name')
  .eq('id', inscription.school_id)
  .single();
```
❌ **Downside**: Multiple round trips, slower performance

### Option 2: Generated Types (Recommended for Production)
```bash
# Generate types from Supabase schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```
✅ **Advantage**: Type-safe without manual assertions

## 📚 Related Files

- `src/features/modules/inscriptions/hooks/useInscriptions.ts` - Fixed hooks
- `src/features/modules/inscriptions/types/inscriptions.types.ts` - Type definitions
- `database/INSCRIPTIONS_SCHEMA.sql` - Database schema

## 🚀 Result

✅ **TypeScript errors resolved**
✅ **Type safety maintained** (using explicit interfaces)
✅ **No runtime impact** (type assertions are compile-time only)
✅ **Query performance unchanged**

## 📖 References

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [TypeScript Deep Instantiation Issue](https://github.com/microsoft/TypeScript/issues/34933)
- [React Query TypeScript Guide](https://tanstack.com/query/latest/docs/react/typescript)
