import { ValidationError } from "../../../../shared/errors/ValidationError.js";
export class Habit { public constructor(public readonly id: string, public readonly userId: string, private title: string) { this.title = title.trim(); if (!this.title) throw new ValidationError("Habit title cannot be empty"); } public getTitle(): string { return this.title; } }
