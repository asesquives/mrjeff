export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cash_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          reference_order_id: string | null
          type: Database["public"]["Enums"]["cash_type"]
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          reference_order_id?: string | null
          type: Database["public"]["Enums"]["cash_type"]
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference_order_id?: string | null
          type?: Database["public"]["Enums"]["cash_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_entries_reference_order_id_fkey"
            columns: ["reference_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      operators: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color_tag: Database["public"]["Enums"]["color_tag"]
          id: string
          item_type: Database["public"]["Enums"]["item_type"]
          order_id: string
          quantity_in: number
          quantity_out: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          color_tag?: Database["public"]["Enums"]["color_tag"]
          id?: string
          item_type: Database["public"]["Enums"]["item_type"]
          order_id: string
          quantity_in?: number
          quantity_out?: number
          subtotal?: number
          unit_price?: number
        }
        Update: {
          color_tag?: Database["public"]["Enums"]["color_tag"]
          id?: string
          item_type?: Database["public"]["Enums"]["item_type"]
          order_id?: string
          quantity_in?: number
          quantity_out?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          operator_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          promised_at: string | null
          received_at: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          promised_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          operator_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          promised_at?: string | null
          received_at?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          client_doc: string | null
          client_name: string
          created_at: string
          id: string
          order_id: string
          receipt_type: Database["public"]["Enums"]["receipt_type"]
          status: Database["public"]["Enums"]["receipt_status"]
        }
        Insert: {
          client_doc?: string | null
          client_name: string
          created_at?: string
          id?: string
          order_id: string
          receipt_type: Database["public"]["Enums"]["receipt_type"]
          status?: Database["public"]["Enums"]["receipt_status"]
        }
        Update: {
          client_doc?: string | null
          client_name?: string
          created_at?: string
          id?: string
          order_id?: string
          receipt_type?: Database["public"]["Enums"]["receipt_type"]
          status?: Database["public"]["Enums"]["receipt_status"]
        }
        Relationships: [
          {
            foreignKeyName: "receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cash_type: "income" | "expense"
      color_tag: "blanco" | "color"
      item_type:
        | "polo"
        | "pantalon"
        | "camisa"
        | "short"
        | "vestido"
        | "sabana"
        | "toalla"
        | "otro"
      order_status:
        | "received"
        | "processing"
        | "ready"
        | "delivered"
        | "cancelled"
      payment_method: "cash" | "yape" | "pos" | "bank"
      receipt_status: "pending" | "issued"
      receipt_type: "boleta" | "factura"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cash_type: ["income", "expense"],
      color_tag: ["blanco", "color"],
      item_type: [
        "polo",
        "pantalon",
        "camisa",
        "short",
        "vestido",
        "sabana",
        "toalla",
        "otro",
      ],
      order_status: [
        "received",
        "processing",
        "ready",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cash", "yape", "pos", "bank"],
      receipt_status: ["pending", "issued"],
      receipt_type: ["boleta", "factura"],
    },
  },
} as const
