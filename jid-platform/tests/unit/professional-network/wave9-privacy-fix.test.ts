import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect,it } from 'vitest'
it('withdraws previously shared updates when visibility is disabled',()=>{const sql=readFileSync(resolve('supabase/migrations/20260831130100_wave9_updates_visibility_fix.sql'),'utf8');expect(sql).toContain("SET audience='private'");expect(sql).toContain("NEW.updates_enabled IS FALSE");expect(sql).toContain('author_id=NEW.profile_id')})
