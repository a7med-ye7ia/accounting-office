package com.accounting.backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "permission_roles")
public class PermissionRole {

    @EmbeddedId
    private PermissionRoleId id;

    @ManyToOne
    @MapsId("roleId")
    @JoinColumn(name = "role_id")
    private Role role;

    @ManyToOne
    @MapsId("permissionId")
    @JoinColumn(name = "permission_id")
    private Permission permission;

    // Getters and setters

    public PermissionRoleId getId() { return id; }
    public void setId(PermissionRoleId id) { this.id = id; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Permission getPermission() { return permission; }
    public void setPermission(Permission permission) { this.permission = permission; }

}