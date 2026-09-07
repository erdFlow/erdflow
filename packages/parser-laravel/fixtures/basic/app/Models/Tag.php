<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tag_user');
    }
}
