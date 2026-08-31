-- Wave 9: additive governed professional connections and updates.
-- Employer discoverability remains a separate Wave 8 permission.
CREATE TYPE public.professional_connection_state_enum AS ENUM ('pending','accepted','declined');
CREATE TYPE public.professional_update_kind_enum AS ENUM ('project','achievement','learning','credential','career');
CREATE TYPE public.professional_update_audience_enum AS ENUM ('connections','private');

CREATE TABLE public.professional_network_preferences (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepts_connections boolean NOT NULL DEFAULT true,
  updates_enabled boolean NOT NULL DEFAULT true,
  default_audience public.professional_update_audience_enum NOT NULL DEFAULT 'connections',
  updated_at timestamptz NOT NULL DEFAULT timezone('utc',now())
);
CREATE TABLE public.professional_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state public.professional_connection_state_enum NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc',now()), responded_at timestamptz,
  CHECK(requester_id<>recipient_id)
);
CREATE UNIQUE INDEX professional_connections_pair_unique ON public.professional_connections
  (LEAST(requester_id,recipient_id),GREATEST(requester_id,recipient_id));
CREATE TABLE public.professional_network_blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc',now()),
  PRIMARY KEY(blocker_id,blocked_id), CHECK(blocker_id<>blocked_id)
);
CREATE TABLE public.professional_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.professional_update_kind_enum NOT NULL,
  body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 2000),
  audience public.professional_update_audience_enum NOT NULL DEFAULT 'connections',
  created_at timestamptz NOT NULL DEFAULT timezone('utc',now()), deleted_at timestamptz
);
CREATE INDEX professional_updates_chrono ON public.professional_updates(author_id,created_at DESC)
  WHERE deleted_at IS NULL;
COMMENT ON TABLE public.professional_updates IS
  'Professional context; never Career Record evidence automatically.';

CREATE FUNCTION public.wave9_individual(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_id AND p.role='individual'
   AND p.deleted_at IS NULL AND p.suspended_at IS NULL) $$;
CREATE FUNCTION public.wave9_connected(a uuid,b uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM public.professional_connections c WHERE c.state='accepted'
   AND ((c.requester_id=a AND c.recipient_id=b) OR (c.requester_id=b AND c.recipient_id=a))) $$;

CREATE FUNCTION public.request_professional_connection(p_recipient_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE x uuid;
BEGIN
 IF NOT public.wave9_individual(auth.uid()) OR NOT public.wave9_individual(p_recipient_id)
   OR auth.uid()=p_recipient_id
   OR EXISTS(SELECT 1 FROM public.professional_network_blocks WHERE
     (blocker_id=auth.uid() AND blocked_id=p_recipient_id) OR
     (blocker_id=p_recipient_id AND blocked_id=auth.uid()))
   OR COALESCE((SELECT NOT accepts_connections FROM public.professional_network_preferences
     WHERE profile_id=p_recipient_id),false)
 THEN RAISE EXCEPTION 'profile not available' USING ERRCODE='insufficient_privilege'; END IF;
 INSERT INTO public.professional_connections(requester_id,recipient_id)
 VALUES(auth.uid(),p_recipient_id) RETURNING id INTO x;
 PERFORM public._write_audit_log(auth.uid(),'network.connection_requested',
   'professional_connections',x,NULL,jsonb_build_object('recipient_id',p_recipient_id));
 RETURN x;
END $$;
CREATE FUNCTION public.respond_professional_connection(p_connection_id uuid,p_accept boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
 UPDATE public.professional_connections SET
   state=CASE WHEN p_accept THEN 'accepted'::public.professional_connection_state_enum
     ELSE 'declined' END, responded_at=timezone('utc',now())
 WHERE id=p_connection_id AND recipient_id=auth.uid() AND state='pending';
 IF NOT FOUND THEN RAISE EXCEPTION 'connection not found' USING ERRCODE='insufficient_privilege'; END IF;
 PERFORM public._write_audit_log(auth.uid(),'network.connection_responded',
   'professional_connections',p_connection_id,NULL,jsonb_build_object('accepted',p_accept));
 RETURN p_connection_id;
END $$;
CREATE FUNCTION public.disconnect_professional_connection(p_connection_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
 DELETE FROM public.professional_connections WHERE id=p_connection_id AND state='accepted'
   AND auth.uid() IN(requester_id,recipient_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'connection not found' USING ERRCODE='insufficient_privilege'; END IF;
 PERFORM public._write_audit_log(auth.uid(),'network.disconnected',
   'professional_connections',p_connection_id,NULL,NULL); RETURN p_connection_id;
END $$;
CREATE FUNCTION public.block_professional_profile(p_profile_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
 IF NOT public.wave9_individual(auth.uid()) OR auth.uid()=p_profile_id
   THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='insufficient_privilege'; END IF;
 DELETE FROM public.professional_connections WHERE
   (requester_id=auth.uid() AND recipient_id=p_profile_id) OR
   (recipient_id=auth.uid() AND requester_id=p_profile_id);
 INSERT INTO public.professional_network_blocks(blocker_id,blocked_id)
   VALUES(auth.uid(),p_profile_id) ON CONFLICT DO NOTHING;
 PERFORM public._write_audit_log(auth.uid(),'network.profile_blocked','profiles',p_profile_id,
   NULL,jsonb_build_object('blocked',true)); RETURN p_profile_id;
END $$;
CREATE FUNCTION public.create_professional_update(
 p_kind public.professional_update_kind_enum,p_body text,
 p_audience public.professional_update_audience_enum DEFAULT 'connections') RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE x uuid;
BEGIN
 IF NOT public.wave9_individual(auth.uid()) OR COALESCE((SELECT NOT updates_enabled
   FROM public.professional_network_preferences WHERE profile_id=auth.uid()),false)
 THEN RAISE EXCEPTION 'not permitted' USING ERRCODE='insufficient_privilege'; END IF;
 INSERT INTO public.professional_updates(author_id,kind,body,audience)
   VALUES(auth.uid(),p_kind,btrim(p_body),p_audience) RETURNING id INTO x;
 PERFORM public._write_audit_log(auth.uid(),'network.update_created','professional_updates',x,
   NULL,jsonb_build_object('audience',p_audience)); RETURN x;
END $$;
CREATE FUNCTION public.delete_professional_update(p_update_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN UPDATE public.professional_updates SET deleted_at=timezone('utc',now())
 WHERE id=p_update_id AND author_id=auth.uid() AND deleted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'update not found' USING ERRCODE='insufficient_privilege'; END IF;
 RETURN p_update_id; END $$;
CREATE FUNCTION public.set_professional_network_preferences(
 p_accepts boolean,p_updates boolean,p_audience public.professional_update_audience_enum) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
 IF NOT public.wave9_individual(auth.uid()) THEN RAISE EXCEPTION 'individual required'; END IF;
 INSERT INTO public.professional_network_preferences(profile_id,accepts_connections,updates_enabled,default_audience)
 VALUES(auth.uid(),p_accepts,p_updates,p_audience) ON CONFLICT(profile_id) DO UPDATE SET
 accepts_connections=EXCLUDED.accepts_connections,updates_enabled=EXCLUDED.updates_enabled,
 default_audience=EXCLUDED.default_audience,updated_at=timezone('utc',now()); RETURN auth.uid();
END $$;
CREATE FUNCTION public.get_professional_network() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_catalog AS $$
BEGIN
 IF NOT public.wave9_individual(auth.uid()) THEN RAISE EXCEPTION 'individual required' USING ERRCODE='insufficient_privilege'; END IF;
 RETURN jsonb_build_object(
 'preferences',COALESCE((SELECT jsonb_build_object('acceptsConnections',accepts_connections,
   'updatesEnabled',updates_enabled,'defaultAudience',default_audience)
   FROM public.professional_network_preferences WHERE profile_id=auth.uid()),
   jsonb_build_object('acceptsConnections',true,'updatesEnabled',true,'defaultAudience','connections')),
 'connections',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'profileId',p.id,
   'name',COALESCE(p.full_name,''),'headline',p.headline))
   FROM public.professional_connections c JOIN public.profiles p
   ON p.id=CASE WHEN c.requester_id=auth.uid() THEN c.recipient_id ELSE c.requester_id END
   WHERE c.state='accepted' AND auth.uid() IN(c.requester_id,c.recipient_id)),'[]'::jsonb),
 'incoming',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'profileId',p.id,
   'name',COALESCE(p.full_name,''),'headline',p.headline) ORDER BY c.created_at DESC)
   FROM public.professional_connections c JOIN public.profiles p ON p.id=c.requester_id
   WHERE c.recipient_id=auth.uid() AND c.state='pending'),'[]'::jsonb),
 'updates',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.id,'authorId',p.id,
   'authorName',COALESCE(p.full_name,''),'kind',u.kind,'body',u.body,'audience',u.audience,
   'createdAt',u.created_at,'isOwner',u.author_id=auth.uid()) ORDER BY u.created_at DESC)
   FROM public.professional_updates u JOIN public.profiles p ON p.id=u.author_id
   WHERE u.deleted_at IS NULL AND (u.author_id=auth.uid() OR
   (u.audience='connections' AND public.wave9_connected(auth.uid(),u.author_id))) LIMIT 50),'[]'::jsonb));
END $$;

ALTER TABLE public.professional_network_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_network_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_updates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.professional_network_preferences,public.professional_connections,
 public.professional_network_blocks,public.professional_updates FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.wave9_individual(uuid),public.wave9_connected(uuid,uuid),
 public.request_professional_connection(uuid),public.respond_professional_connection(uuid,boolean),
 public.disconnect_professional_connection(uuid),public.block_professional_profile(uuid),
 public.create_professional_update(public.professional_update_kind_enum,text,public.professional_update_audience_enum),
 public.delete_professional_update(uuid),public.set_professional_network_preferences(boolean,boolean,public.professional_update_audience_enum),
 public.get_professional_network() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_professional_connection(uuid),
 public.respond_professional_connection(uuid,boolean),public.disconnect_professional_connection(uuid),
 public.block_professional_profile(uuid),
 public.create_professional_update(public.professional_update_kind_enum,text,public.professional_update_audience_enum),
 public.delete_professional_update(uuid),public.set_professional_network_preferences(boolean,boolean,public.professional_update_audience_enum),
 public.get_professional_network() TO authenticated;
