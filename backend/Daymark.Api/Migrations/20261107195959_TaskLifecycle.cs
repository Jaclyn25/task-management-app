using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Daymark.Api.Migrations
{
    /// <inheritdoc />
    public partial class TaskLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                    table.CheckConstraint("CK_Task_Completion", "(\"Status\" = 2 AND \"CompletedAt\" IS NOT NULL) OR (\"Status\" <> 2 AND \"CompletedAt\" IS NULL)");
                    table.CheckConstraint("CK_Task_Dates", "\"StartDate\" IS NULL OR \"DueDate\" IS NULL OR \"StartDate\" <= \"DueDate\"");
                    table.CheckConstraint("CK_Task_Priority", "\"Priority\" BETWEEN 0 AND 3");
                    table.CheckConstraint("CK_Task_Status", "\"Status\" BETWEEN 0 AND 2");
                    table.CheckConstraint("CK_Task_Title", "length(trim(\"Title\")) > 0");
                    table.ForeignKey(
                        name: "FK_Tasks_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tasks_Category_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Category",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CategoryId",
                table: "Tasks",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_OwnerId_Priority",
                table: "Tasks",
                columns: new[] { "OwnerId", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_OwnerId_Status_DueDate",
                table: "Tasks",
                columns: new[] { "OwnerId", "Status", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_OwnerId_UpdatedAt",
                table: "Tasks",
                columns: new[] { "OwnerId", "UpdatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tasks");
        }
    }
}
