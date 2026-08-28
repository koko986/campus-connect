export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      account_moderation: {
        Row: {
          blocked_at: string | null;
          blocked_by: string | null;
          reason: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          blocked_at?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          blocked_at?: string | null;
          blocked_by?: string | null;
          reason?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "account_moderation_blocked_by_fkey";
            columns: ["blocked_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "account_moderation_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: {
          created_at: string;
          is_active: boolean;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          is_active?: boolean;
          role: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_active?: boolean;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      answer_votes: {
        Row: {
          answer_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          answer_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          answer_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answer_votes_answer_id_fkey";
            columns: ["answer_id"];
            isOneToOne: false;
            referencedRelation: "answers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answer_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      answers: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_accepted: boolean;
          question_id: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_accepted?: boolean;
          question_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_accepted?: boolean;
          question_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      campuses: {
        Row: {
          address: string | null;
          city: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          source_url: string | null;
          university_id: string;
        };
        Insert: {
          address?: string | null;
          city: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          source_url?: string | null;
          university_id: string;
        };
        Update: {
          address?: string | null;
          city?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          source_url?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campuses_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          joined_at: string;
          last_read_at: string | null;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          joined_at?: string;
          last_read_at?: string | null;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          joined_at?: string;
          last_read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          last_message_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          last_message_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          last_message_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          id: string;
          name: string;
          source_url: string | null;
          university_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          source_url?: string | null;
          university_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          source_url?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departments_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          sender_id: string | null;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          sender_id?: string | null;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          sender_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_actions: {
        Row: {
          action: string;
          admin_email: string;
          admin_id: string;
          created_at: string;
          id: string;
          reason: string;
          report_id: string | null;
          target_id: string;
          target_snapshot: Json;
          target_type: string;
        };
        Insert: {
          action: string;
          admin_email: string;
          admin_id: string;
          created_at?: string;
          id?: string;
          reason: string;
          report_id?: string | null;
          target_id: string;
          target_snapshot?: Json;
          target_type: string;
        };
        Update: {
          action?: string;
          admin_email?: string;
          admin_id?: string;
          created_at?: string;
          id?: string;
          reason?: string;
          report_id?: string | null;
          target_id?: string;
          target_snapshot?: Json;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          body: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          notification_type: Database["public"]["Enums"]["notification_type"];
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          body: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type: Database["public"]["Enums"]["notification_type"];
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          body?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          notification_type?: Database["public"]["Enums"]["notification_type"];
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          image_path: string | null;
          moderation_status: string;
          removal_reason: string | null;
          removed_at: string | null;
          removed_by: string | null;
          topic: string | null;
          university_id: string | null;
          updated_at: string;
          visibility: Database["public"]["Enums"]["post_visibility"];
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          moderation_status?: string;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          topic?: string | null;
          university_id?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["post_visibility"];
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          image_path?: string | null;
          moderation_status?: string;
          removal_reason?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          topic?: string | null;
          university_id?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["post_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_removed_by_fkey";
            columns: ["removed_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "posts_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"];
          avatar_path: string | null;
          bio: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          is_public: boolean;
          updated_at: string;
        };
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"];
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          is_public?: boolean;
          updated_at?: string;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"];
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_public?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      programs: {
        Row: {
          degree_level: string | null;
          department_id: string | null;
          description: string | null;
          id: string;
          name: string;
          source_url: string | null;
          university_id: string;
        };
        Insert: {
          degree_level?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          source_url?: string | null;
          university_id: string;
        };
        Update: {
          degree_level?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          source_url?: string | null;
          university_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      prospective_profiles: {
        Row: {
          preferences: string | null;
          preferred_city: string | null;
          preferred_degree_level: string | null;
          preferred_field: string | null;
          user_id: string;
        };
        Insert: {
          preferences?: string | null;
          preferred_city?: string | null;
          preferred_degree_level?: string | null;
          preferred_field?: string | null;
          user_id: string;
        };
        Update: {
          preferences?: string | null;
          preferred_city?: string | null;
          preferred_degree_level?: string | null;
          preferred_field?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prospective_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      question_tags: {
        Row: {
          question_id: string;
          tag: string;
        };
        Insert: {
          question_id: string;
          tag: string;
        };
        Update: {
          question_id?: string;
          tag?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_tags_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_resolved: boolean;
          title: string;
          university_id: string | null;
          updated_at: string;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          title: string;
          university_id?: string | null;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          title?: string;
          university_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          status: string;
          target_id: string;
          target_snapshot: Json;
          target_type: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: string;
          target_id: string;
          target_snapshot?: Json;
          target_type: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: string;
          target_id?: string;
          target_snapshot?: Json;
          target_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_universities: {
        Row: {
          created_at: string;
          university_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          university_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          university_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_universities_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_universities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      student_profiles: {
        Row: {
          academic_year: number | null;
          campus_id: string | null;
          department_id: string | null;
          program_id: string | null;
          university_id: string;
          user_id: string;
          verification_status: string;
          verified_at: string | null;
        };
        Insert: {
          academic_year?: number | null;
          campus_id?: string | null;
          department_id?: string | null;
          program_id?: string | null;
          university_id: string;
          user_id: string;
          verification_status?: string;
          verified_at?: string | null;
        };
        Update: {
          academic_year?: number | null;
          campus_id?: string | null;
          department_id?: string | null;
          program_id?: string | null;
          university_id?: string;
          user_id?: string;
          verification_status?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_profiles_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_profiles_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_profiles_university_id_fkey";
            columns: ["university_id"];
            isOneToOne: false;
            referencedRelation: "universities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      universities: {
        Row: {
          about: string | null;
          archived_at: string | null;
          archived_by: string | null;
          city: string;
          contact_email: string | null;
          contact_phone: string | null;
          country_code: string;
          created_at: string;
          data_source_url: string | null;
          data_verified_at: string | null;
          description: string;
          founded_year: number | null;
          id: string;
          is_published: boolean;
          logo_path: string | null;
          name: string;
          region: string | null;
          short_name: string;
          slug: string;
          university_type: Database["public"]["Enums"]["university_type"];
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          about?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          country_code?: string;
          created_at?: string;
          data_source_url?: string | null;
          data_verified_at?: string | null;
          description: string;
          founded_year?: number | null;
          id?: string;
          is_published?: boolean;
          logo_path?: string | null;
          name: string;
          region?: string | null;
          short_name: string;
          slug: string;
          university_type: Database["public"]["Enums"]["university_type"];
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          about?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          city?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          country_code?: string;
          created_at?: string;
          data_source_url?: string | null;
          data_verified_at?: string | null;
          description?: string;
          founded_year?: number | null;
          id?: string;
          is_published?: boolean;
          logo_path?: string | null;
          name?: string;
          region?: string | null;
          short_name?: string;
          slug?: string;
          university_type?: Database["public"]["Enums"]["university_type"];
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "universities_archived_by_fkey";
            columns: ["archived_by"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      start_direct_conversation: {
        Args: { other_user_id: string };
        Returns: string;
      };
    };
    Enums: {
      account_type: "current_student" | "prospective_student";
      notification_type: "comment" | "answer" | "message" | "like" | "helpful_vote" | "system";
      post_visibility: "public" | "university";
      university_type: "public" | "private";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_type: ["current_student", "prospective_student"],
      notification_type: ["comment", "answer", "message", "like", "helpful_vote", "system"],
      post_visibility: ["public", "university"],
      university_type: ["public", "private"],
    },
  },
} as const;
