import assert from "node:assert/strict"
import test from "node:test"
import { parseEloquentModel } from "../src/parse-model.js"

test("parseEloquentModel extracts class, table, and relation calls", () => {
  const source = `<?php
namespace App\\Models;
class Account extends Model
{
    protected $table = 'accounts_custom';

    public function owner()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'notification_user')->withPivot('read_at');
    }
}
`
  const model = parseEloquentModel(source)
  assert.ok(model)
  assert.equal(model.className, "Account")
  assert.equal(model.table, "accounts_custom")
  assert.equal(model.relations.length, 4)

  const owner = model.relations.find((r) => r.methodName === "owner")
  assert.ok(owner)
  assert.equal(owner.kind, "belongsTo")
  assert.equal(owner.relatedModel, "User")
  assert.equal(owner.foreignKey, "sent_by")

  const notes = model.relations.find((r) => r.methodName === "notes")
  assert.ok(notes)
  assert.equal(notes.kind, "hasMany")
  assert.equal(notes.relatedModel, "Note")

  const users = model.relations.find((r) => r.methodName === "users")
  assert.ok(users)
  assert.equal(users.kind, "belongsToMany")
  assert.equal(users.pivotTable, "notification_user")
})

test("parseEloquentModel skips morphTo and hasManyThrough", () => {
  const source = `<?php
class Widget extends Model
{
    public function parent()
    {
        return $this->morphTo();
    }

    public function throughs()
    {
        return $this->hasManyThrough(Post::class, User::class);
    }

    public function user()
    {
        return $this->belongsTo(\\App\\Models\\User::class);
    }
}
`
  const model = parseEloquentModel(source)
  assert.ok(model)
  assert.equal(model.relations.length, 1)
  assert.equal(model.relations[0]?.relatedModel, "User")
})
