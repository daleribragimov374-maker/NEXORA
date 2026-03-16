import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, Zap, Ghost, Globe, Code, Upload, Loader2, Trash2, Image as ImageIcon, Gamepad2 } from 'lucide-react';
import { supabase } from '../supabaseClient';



export default function CreateGame() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [myExperiences, setMyExperiences] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editingExperience, setEditingExperience] = useState(null);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('experiences')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setMyExperiences(data.map(exp => ({
                id: exp.id,
                name: exp.title,
                description: exp.description,
                imageUrl: exp.image_url,
                fileUrl: exp.file_url,
                date: new Date(exp.created_at).toISOString().split('T')[0],
                plays: exp.plays || 0
            })));
        } catch (err) {
            console.error('Error fetching experiences:', err);
        } finally {
            setIsLoading(false);
        }
    };



    const templates = [
        { id: 1, name: 'Baseplate', description: 'A completely empty world.', icon: Ghost, color: '#94a3b8' },
        { id: 2, name: 'Classic Baseplate', description: 'The original Roblox baseplate.', icon: Ghost, color: '#64748b' },
        { id: 3, name: 'Flat Terrain', description: 'A wide grassy area.', icon: Globe, color: '#10b981' },
        { id: 4, name: 'Obby Starter', description: 'Basics for an obstacle course.', icon: Zap, color: '#f59e0b' },
        { id: 5, name: 'Racing', description: 'Ready-to-go racing mechanics.', icon: Zap, color: '#3b82f6' },
        { id: 6, name: 'Team FFA', icon: Layout, color: '#ef4444' }
    ];

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.title.trim()) return;

        setIsCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let imageUrl = editingExperience?.imageUrl || null;
            if (selectedImage) {
                const imgExt = selectedImage.name.split('.').pop();
                const imgName = `${Math.random()}.${imgExt}`;
                const imgPath = `${user.id}/img_${Date.now()}_${imgName}`;

                const { error: imgUploadError } = await supabase.storage
                    .from('experiences')
                    .upload(imgPath, selectedImage);

                if (imgUploadError) throw imgUploadError;

                const { data: { publicUrl: imgPublicUrl } } = supabase.storage
                    .from('experiences')
                    .getPublicUrl(imgPath);

                imageUrl = imgPublicUrl;
            }

            let fileUrl = editingExperience?.fileUrl || null;
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${Date.now()}_${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('experiences')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('experiences')
                    .getPublicUrl(filePath);

                fileUrl = publicUrl;
            }

            if (editingExperience) {
                const { data, error } = await supabase
                    .from('experiences')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        file_url: fileUrl,
                        image_url: imageUrl
                    })
                    .eq('id', editingExperience.id)
                    .select()
                    .single();

                if (error) throw error;

                setMyExperiences(myExperiences.map(exp => exp.id === data.id ? {
                    ...exp,
                    name: data.title,
                    description: data.description,
                    imageUrl: data.image_url,
                    fileUrl: data.file_url
                } : exp));
            } else {
                const { data, error } = await supabase
                    .from('experiences')
                    .insert([
                        {
                            user_id: user.id,
                            title: formData.title,
                            description: formData.description,
                            file_url: fileUrl,
                            image_url: imageUrl
                        }
                    ])
                    .select()
                    .single();

                if (error) throw error;

                const newExp = {
                    id: data.id,
                    name: data.title,
                    description: data.description || 'No description provided.',
                    imageUrl: data.image_url,
                    fileUrl: data.file_url,
                    date: new Date(data.created_at).toISOString().split('T')[0],
                    plays: data.plays || 0
                };
                setMyExperiences([newExp, ...myExperiences]);
            }

            setFormData({ title: '', description: '' });
            setSelectedFile(null);
            setSelectedImage(null);
            setImagePreview(null);
            setEditingExperience(null);
            setShowModal(false);
        } catch (err) {
            console.error('Error saving experience:', err);
            alert('Failed to save experience: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };


    const openTemplate = (template) => {
        setEditingExperience(null);
        setFormData({ title: `New ${template.name}`, description: template.description });
        setImagePreview(null);
        setShowModal(true);
    };

    const handlePlay = (exp) => {
        navigate('/play', {
            state: {
                title: exp.name,
                imageUrl: exp.imageUrl,
                fileUrl: exp.fileUrl
            }
        });
    };

    const handleEdit = (exp) => {
        setEditingExperience(exp);
        setFormData({ title: exp.name, description: exp.description });
        setImagePreview(exp.imageUrl);
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        document.getElementById('experience-file-input').click();
    };

    const triggerImageInput = () => {
        document.getElementById('experience-image-input').click();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this experience?')) return;

        try {
            const { error } = await supabase
                .from('experiences')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMyExperiences(myExperiences.filter(exp => exp.id !== id));
        } catch (err) {
            console.error('Error deleting experience:', err);
            alert('Failed to delete: ' + err.message);
        }
    };



    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />
                <div className="dashboard-scroll" style={{ padding: '2rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                                Create <span style={{ color: '#3b82f6' }}>Experience</span>
                            </h1>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                Bring your imagination to life in the Nexora metaverse.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingExperience(null);
                                setFormData({ title: '', description: '' });
                                setImagePreview(null);
                                setShowModal(true);
                            }}
                            style={{ height: 'fit-content', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '700' }}
                        >
                            <Plus size={20} /> New Experience
                        </button>
                    </div>

                    {/* My Experiences Section */}
                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Zap size={24} style={{ color: '#f59e0b' }} /> My Experiences
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 180px)', gap: '1.25rem', alignItems: 'start' }}>
                            {isLoading ? (
                                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
                                    <p>Loading your experiences...</p>
                                </div>
                            ) : myExperiences.length > 0 ? (
                                myExperiences.map(exp => (
                                    <div key={exp.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', position: 'relative' }} className="game-card">
                                        <div style={{ width: '100%', aspectRatio: '1', background: 'rgba(59, 130, 246, 0.05)', position: 'relative' }}>
                                            {exp.imageUrl ? (
                                                <img src={exp.imageUrl} alt={exp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Layout size={40} style={{ color: '#3b82f6', opacity: 0.5 }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800', borderBottom: '1px solid var(--border-main)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>{exp.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                    {exp.date} • {exp.plays} Plays
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handlePlay(exp)}
                                                    style={{ flex: 2, background: '#3b82f6', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'background 0.2s' }}
                                                >
                                                    <Gamepad2 size={16} /> Play
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(exp)}
                                                    className="btn-icon"
                                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-main)', color: 'var(--text-main)', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    title="Edit Experience"
                                                >
                                                    <Code size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="btn-icon delete-hover"
                                                    style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                    title="Delete Experience"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-main)', color: 'var(--text-muted)' }}>
                                    <p style={{ margin: 0 }}>You haven't created any experiences yet. Start building!</p>
                                </div>
                            )}
                        </div>

                    </section>

                    {/* Starter Templates Section */}
                    <section>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Layout size={24} style={{ color: '#3b82f6' }} /> Starter Templates
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 180px)', gap: '1.25rem', alignItems: 'start' }}>
                            {templates.map(template => {
                                const Icon = template.icon;
                                return (
                                    <div
                                        key={template.id}
                                        className="game-card"
                                        onClick={() => openTemplate(template)}
                                        style={{ padding: '1.5rem', background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${template.color}22, transparent)`, borderRadius: '0 0 0 100%' }}></div>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${template.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', border: `1px solid ${template.color}33` }}>
                                            <Icon size={24} style={{ color: template.color }} />
                                        </div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.2rem' }}>{template.name}</h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                            {template.description || 'Start building with this professional template.'}
                                        </p>
                                        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600' }}>
                                            Select Template <Plus size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                </div>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="modal-content" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>Create Experience</h2>
                        <p style={{ margin: '0 0 2rem 0', color: 'var(--text-muted)' }}>Configure your project settings to get started.</p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Experience Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter title..."
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '1rem' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description (Optional)</label>
                                <textarea
                                    rows="3"
                                    placeholder="What's this experience about?"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-main)', color: 'var(--text-main)', fontSize: '1rem', resize: 'none' }}
                                ></textarea>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Experience Icon</label>
                                <div
                                    onClick={triggerImageInput}
                                    style={{
                                        border: '2px dashed var(--border-main)',
                                        borderRadius: '16px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        background: selectedImage ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.02)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        borderColor: selectedImage ? '#3b82f6' : 'var(--border-main)'
                                    }} className="upload-zone">
                                    <input
                                        type="file"
                                        id="experience-image-input"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    {imagePreview ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', marginBottom: '1rem', border: '2px solid #3b82f6' }} />
                                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedImage.name}</p>
                                            <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.8rem', fontWeight: '600' }}>Image selected</p>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Click to upload experience icon</p>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Supported formats: .jpg, .png, .gif</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '2.5rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Project File (Mockup)</label>
                                <div
                                    onClick={triggerFileInput}
                                    style={{
                                        border: '2px dashed var(--border-main)',
                                        borderRadius: '16px',
                                        padding: '2rem',
                                        textAlign: 'center',
                                        background: selectedFile ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.02)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        borderColor: selectedFile ? '#3b82f6' : 'var(--border-main)'
                                    }} className="upload-zone">
                                    <input
                                        type="file"
                                        id="experience-file-input"
                                        accept=".html,.js,.javascript,.css"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    {selectedFile ? (
                                        <>
                                            <Code size={32} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedFile.name}</p>
                                            <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.8rem', fontWeight: '600' }}>File selected</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={32} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Click to upload project file</p>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Supported formats: .html, .js, .css</p>
                                        </>
                                    )}
                                </div>

                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingExperience(null);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: '700' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', fontWeight: '700' }}
                                >
                                    {isCreating ? 'Saving...' : (editingExperience ? 'Update Experience' : 'Create Experience')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .game-card:hover {
                    transform: translateY(-5px);
                    border-color: #3b82f6 !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .btn-icon:hover {
                    background: rgba(255,255,255,0.1) !important;
                    transform: scale(1.05);
                }
                .delete-hover:hover {
                    background: #ef4444 !important;
                    color: white !important;
                    border-color: #ef4444 !important;
                }
                .upload-zone:hover {
                    border-color: #3b82f6 !important;
                    background: rgba(59, 130, 246, 0.05) !important;
                }
                @keyframes modalSlideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
